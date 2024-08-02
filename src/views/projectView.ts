// src/views/projectView.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { marked } from 'marked';
import { getProjectTabContent } from '../webview/getProjectTabContent';
import { projectGo } from '../openai/openaiService';
import { HistoryManager, HistoryEntry } from '../utils/historyManager';
import { extractMemberFromPrompt, Setup, validate_fixMemberIcons, load_setups } from '../utils/setup';
import { queueMemberAssignment } from '../utils/queueMemberAssignment';
import { validatePrompts } from '../utils/prompts';
import { SETUPS_FILE, HISTORY_FILE, openAnswerPanel, openRosterPanel } from '../extension';
import { saveJsonToFile } from '../file/fileOperations';

export class ProjectViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private currentProjectPanel: vscode.WebviewPanel | undefined;
    private historyManager: HistoryManager;
    private global_context: vscode.ExtensionContext;

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;
    
    constructor(context: vscode.ExtensionContext) {
        this.global_context = context;
        this.historyManager = new HistoryManager(HISTORY_FILE, this);

        const setups:Setup[] = load_setups(context);
        context.globalState.update('setups', setups);
        if(!validate_fixMemberIcons(setups)) {
            saveJsonToFile(SETUPS_FILE, setups).then(
                () => this.refresh()
            );
        }

    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            const local_resources = this.global_context.extensionUri;
            // Root level: Commands
            const issues = validatePrompts().length > 0;
            const items = [new ProjectItem("Builder", issues, local_resources), new ProjectItem("Team Lineup", false, local_resources), new HistoryRootItem("History")];
            return Promise.resolve(items);
        } else if (element instanceof HistoryRootItem) {
            // If the element is the HistoryRootItem, return the date entries
            const groupedHistory = this.historyManager.getHistoryGroupedByDate();
            const dateItems = Object.keys(groupedHistory).map(date => new DateItem(date));
            return Promise.resolve(dateItems);
        } else if (element instanceof DateItem) {
            // If the element is a DateItem, return the history entries for that date
            const historyEntries = this.historyManager.getHistoryGroupedByDate()[element.label as string];
            return Promise.resolve(historyEntries.map((entry: HistoryEntry) => new HistoryItem(entry, this.global_context, this.getSetupIcon(entry.response_by))));
        }
        return Promise.resolve([]);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    handleItemSelection(item: vscode.TreeItem): void {
        if (item instanceof ProjectItem) {
            if(item.label === "Builder") {
                this.openProjectPanel(this.global_context);
            } else if(item.label === "Team Lineup") {
                openRosterPanel(this.global_context);
            }
        } else if (item instanceof HistoryItem && item.entry.markdown) {
            openAnswerPanel(this.global_context, item.entry);
        }
    }

    private openProjectPanel(context: vscode.ExtensionContext) : void {
        if (this.currentProjectPanel !== undefined) {
            this.currentProjectPanel.reveal(vscode.ViewColumn.One);
            this.loadProjectData();
        } else {
            const iconPath = vscode.Uri.file(
                path.join(context.extensionPath, 'resources', 'icon.png')
            );
    
            this.currentProjectPanel = vscode.window.createWebviewPanel(
                'project',
                'Builder',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(context.extensionPath)]
                }
            );
            
            this.currentProjectPanel.iconPath = iconPath;
            this.currentProjectPanel.webview.html = getProjectTabContent(context.extensionUri);
            const setups:Setup[] = context.globalState.get('setups', []);
    
            // Handle messages from the webview
            this.currentProjectPanel.webview.onDidReceiveMessage(async (message: { command: string; text: string }) => {
                switch (message.command) {
                    case 'projectGo':
                        if (!this.historyManager) {
                            throw new Error("HistoryManager is not initialized.");
                        }
                        console.log('Received "projectGo" command with text:', message.text);
                        context.workspaceState.update('project', message.text);
                        const projectAnswer = await projectGo(message.text, setups, this.historyManager);
                        context.workspaceState.update('answer', projectAnswer);
                        const htmlAnswer = marked(projectAnswer);
                        this.currentProjectPanel?.webview.postMessage({ command: 'answer', text: htmlAnswer });
                        break;
                    case 'directedGo':
                        console.log('Received "directedGo" command with text:', message.text);
                        context.workspaceState.update('directed', message.text);
                        // get member from prompt or reject with no eligible member
                        try {
                            if (!this.historyManager) {
                                throw new Error("HistoryManager is not initialized.");
                            }
                            const member = extractMemberFromPrompt(message.text, setups);
                            const directedAnswer = await queueMemberAssignment(member, message.text, setups, this.historyManager);
                            this.openMarkdownPanel(context, directedAnswer);
                        } catch (error) {
                            vscode.window.showErrorMessage(`${error}`);
                        }
                        break;
                    case 'updateDirected':
                        context.workspaceState.update('directed', message.text);
                    break;
                    case 'updateProject':
                        context.workspaceState.update('project', message.text);
                        break;
                    case 'loadData':
                        this.loadProjectData();
                        break;
                }
            });
    
            this.currentProjectPanel.onDidDispose(
                () => {
                    this.currentProjectPanel = undefined;
                },
                null,
                context.subscriptions
            );
        }
    }

    loadProjectData() {
        if (this.currentProjectPanel !== undefined) {
            if (!this.global_context) {
                throw new Error("global_context is not initialized.");
            }
            const project = this.global_context.workspaceState.get('project', '');
            const directed = this.global_context.workspaceState.get('directed', '');
            const answer = this.global_context.workspaceState.get('answer', '');
            const htmlContent = marked(answer);
            const issues = validatePrompts();
            this.currentProjectPanel?.webview.postMessage({ command: 'loadData', question: project, answer: htmlContent, issues: issues, directed: directed });
        }
    }

    async openMarkdownPanel(context: vscode.ExtensionContext, markdown_txt: string) {

        const iconPath = vscode.Uri.file(
            path.join(context.extensionPath, 'resources', 'icon.png')
        );
    
        const date = new Date();
        const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    
        const answerPanel = vscode.window.createWebviewPanel(
            'answer',
            `answer-${formattedTime}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(context.extensionPath)]
            }
        );
        
        answerPanel.iconPath = iconPath;
        const markdownContent = marked(markdown_txt);
        const documentContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Answer</title>
    </head>
    <body>
    ${markdownContent}
    </body>
    </html>`;
    
        answerPanel.webview.html = documentContent;
    }

    private getSetupIcon(responseBy: string): string {
        const setups:Setup[] = this.global_context.globalState.get('setups', []);
        const setup = setups.find((s: any) => s.name === responseBy);
        return setup ? setup.icon : path.join(this.global_context.extensionUri.fsPath, 'resources', 'icon.png'); // Default to black if not found
    }
}

class ProjectItem extends vscode.TreeItem {
    constructor(label: string, issues: boolean, resources: vscode.Uri) {
        super(label, vscode.TreeItemCollapsibleState.None);
        // Use a ThemeIcon and set the color based on the issues flag
        if (issues) {
            const resourceUri = vscode.Uri.joinPath(resources, 'resources', 'process-error-symbolic.svg');
            this.iconPath = resourceUri;
        }
        this.command = {
            command: 'frogteam.openView',
            title: 'Open View',
            arguments: [this]
        };
    }
}

class HistoryRootItem extends vscode.TreeItem {
    constructor(label: string) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.command = {
            command: 'frogteam.openView',
            title: 'Open View',
            arguments: [this]
        };
    }
}

class DateItem extends vscode.TreeItem {
    constructor(label: string) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
    }
}

export class HistoryItem extends vscode.TreeItem {
    constructor(public entry: HistoryEntry, private context: vscode.ExtensionContext, icon: string) {
        super(`${entry.response_by} - ${new Date(entry.timestamp).toLocaleTimeString()}`, vscode.TreeItemCollapsibleState.None);
        this.tooltip = new vscode.MarkdownString(`**${entry.ask}**\n\nModel: ${entry.model}\nResponse by: ${entry.response_by}`);
        this.command = {
            command: 'frogteam.openView',
            title: 'Handle History Item Click',
            arguments: [this]
        };

        // Simulate color in the label text by including the color value in a more user-friendly way
        this.label = {
            label: `${new Date(entry.timestamp).toLocaleTimeString()} - ${entry.response_by}${entry.markdown ? " - M" : ""}`,
        };

        this.iconPath = icon;

    }
}
