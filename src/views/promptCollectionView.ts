import * as vscode from 'vscode';
import { Prompt, all_prompts, newPrompt } from '../utils/prompts'; // Adjust the import path as necessary
import { openPromptPanel } from '../extension';

export class PromptCollectionViewProvider implements vscode.TreeDataProvider<PromptItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PromptItem | undefined | void> = new vscode.EventEmitter<PromptItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<PromptItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
        vscode.commands.registerCommand('frogteam.addPrompt', this.addPrompt, this);
    }

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
    
    async addPrompt(): Promise<void> {
        try {
            const new_prompt:Prompt = newPrompt(this.context);
            this.refresh();
            const newItem = new PromptItem(new_prompt);
            this.handleItemSelection(newItem);
        } catch (error) {
            vscode.window.showErrorMessage((error as any).message);
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