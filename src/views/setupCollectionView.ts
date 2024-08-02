import * as vscode from 'vscode';
import { Setup, newSetup } from '../utils/setup'; // Adjust the import path as necessary
import { openSetupPanel } from '../extension';

export class SetupCollectionViewProvider implements vscode.TreeDataProvider<SetupItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SetupItem | undefined | void> = new vscode.EventEmitter<SetupItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SetupItem | undefined | void> = this._onDidChangeTreeData.event;

    // constructor(private context: vscode.ExtensionContext) {}
    constructor(private context: vscode.ExtensionContext) {
        vscode.commands.registerCommand('frogteam.addSetup', this.addSetup, this);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SetupItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SetupItem): Thenable<SetupItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            //const setups = load_setups(this.context);
            const setups:Setup[] = this.context.globalState.get('setups', []);
            const setupItems = setups.map(setup => new SetupItem(setup));
            return Promise.resolve(setupItems);
        }
    }

    async addSetup(): Promise<void> {
        try {
            let new_setup:Setup = await newSetup(this.context);
            this.refresh();
            const setups: Setup[] = this.context.globalState.get('setups', []);
            setups.push(new_setup);
            await this.context.globalState.update('setups', setups);
            const newItem = new SetupItem(new_setup);
            this.handleItemSelection(newItem);
        } catch(error) {
            vscode.window.showErrorMessage((error as any).message);
        }
    }

    handleItemSelection(item: vscode.TreeItem): void {
        if (item instanceof SetupItem) {
            openSetupPanel(this.context, item.setup);
        }
    }
}

class SetupItem extends vscode.TreeItem {
    constructor(public setup: Setup) {
        super(setup.name, vscode.TreeItemCollapsibleState.None);
        this.description = setup.model;
        this.iconPath = vscode.Uri.file(setup.icon);
        this.tooltip = `${setup.name}\nModel: ${setup.model}`;
        this.command = {
            command: 'frogteam.openSetupPanel',
            title: 'Open Setup Panel',
            arguments: [this]
        };
    }
}