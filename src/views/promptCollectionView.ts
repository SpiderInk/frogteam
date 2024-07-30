import * as vscode from 'vscode';
import { Prompt, all_prompts } from '../utils/prompts'; // Adjust the import path as necessary
import { openPromptPanel } from '../extension';

export class PromptCollectionViewProvider implements vscode.TreeDataProvider<PromptItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PromptItem | undefined | void> = new vscode.EventEmitter<PromptItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<PromptItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PromptItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PromptItem): Thenable<PromptItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            const prompts = all_prompts();
            const promptItems = prompts.map(prompt => new PromptItem(prompt));
            return Promise.resolve(promptItems);
        }
    }
    
    handleItemSelection(item: vscode.TreeItem): void {
        if (item instanceof PromptItem) {
            openPromptPanel(this.context, item.prompt);
        }
    }
}

class PromptItem extends vscode.TreeItem {
    constructor(public prompt: Prompt) {
        super(prompt.models, vscode.TreeItemCollapsibleState.None);
        this.description = `${prompt.category} - ${prompt.tag}`;
        this.tooltip = `Active: ${prompt.active}\nModels: ${prompt.models}\nCategory: ${prompt.category}\nTag: ${prompt.tag}`;
        this.command = {
            command: 'frogteam.openPromptPanel',
            title: 'Open Prompt Panel',
            arguments: [this]
        };
    }
}