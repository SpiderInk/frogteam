import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getNonce } from './getNonce';
import { saveJsonToFile } from '../file/fileOperations';
import { openAnswerPanel, openPromptPanel, openRosterPanel } from '../extension';
import { HistoryManager, HistoryEntry } from '../utils/historyManager';
import { savePrompts, validatePrompts } from '../utils/prompts';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'chatView';
    public view?: vscode.WebviewView;
    private history: HistoryEntry[];

    constructor(private readonly _extensionUri: vscode.Uri, private readonly _context: vscode.ExtensionContext, private readonly prompts_file: string, private readonly setups_file: string, historyManager: HistoryManager) {
        this.history = historyManager.getHistory();
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'savePrompts':
                    await savePrompts(message.prompts);
                    this._context.globalState.update('prompts', message.prompts);
                    this.postIssues(webviewView.webview);
                    // loadProjectData();
                    break;
                case 'saveSetups':
                    await saveJsonToFile(this.setups_file, message.setups);
                    this._context.globalState.update('setups', message.setups);
                    this.postIssues(webviewView.webview);
                    // loadProjectData();
                    break;
                case 'load':
                    this.loadDataIntoWebview();
                    break;
                case 'openRosterPanel':
                    openRosterPanel(this._context);
                    break;
                case 'renderMarkdown':
                    console.log('renderMarkdown');
                    openAnswerPanel(this._context, message.data);
                    break;
                case 'editPrompt':
                    openPromptPanel(this._context, message.data);
                    break;
            }
        });

        this.loadDataIntoWebview();

        webviewView.onDidDispose(() => {
            this.view = undefined;
        });

        vscode.window.onDidChangeActiveTextEditor(() => {
            if (this.view && this.view.visible) {
                this.loadDataIntoWebview();
            }
        });
    }

    public loadDataIntoWebview() {
        if (this.view) {
            const prompts = this._context.globalState.get('prompts', []);
            this.view.webview.postMessage({ command: 'loadPrompts', prompts });

            const setups = this._context.globalState.get('setups', []);
            this.view.webview.postMessage({ command: 'loadSetups', setups });
            
            const history = this.history.slice();
            this.view.webview.postMessage({ command: 'loadHistory', history });

            this.postIssues(this.view.webview);
        }
    }

    private postIssues(webview: vscode.Webview) {
        const issues = validatePrompts();
        webview.postMessage({ command: 'showIssues', issues });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {

        // Get path to resource on disk
        const local_resources = webview.asWebviewUri(this._context.extensionUri).toString();

        const htmlFilePath = path.join(this._extensionUri.fsPath, 'resources', 'component.html');
        try {
            let html = fs.readFileSync(htmlFilePath, 'utf8');
            const nonce = getNonce();
            html = html.replace(/\${nonce}/g, nonce);
            console.log(`setting local resources to: ${local_resources}`);
            html = html.replace(/\${local_resources}/g, local_resources);
            
            return html;
        } catch (error) {
            console.error(`Error reading HTML file: ${error}`);
            return `<html><body><h1>Error loading HTML file</h1></body></html>`;
        }
    }
}