// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { marked } from 'marked';
import { getNonce } from './webview/getNonce';
import { getRosterDocContent } from './webview/getRosterDocContent';
import { getPromptDocContent } from './webview/getPromptDocContent';
import { HistoryEntry } from './utils/historyManager';
import { Prompt, savePrompt, all_prompts, deletePrompt, validatePrompts } from './utils/prompts';
import { ProjectViewProvider, HistoryItem } from './views/projectView';
import { SetupCollectionViewProvider } from './views/setupCollectionView';
import { PromptCollectionViewProvider } from './views/promptCollectionView';
import { load_setups, Setup, saveSetup, deleteSetup, fetchSetupByName } from './utils/setup';
import { getSetupDocContent } from './webview/getSetupDocContent';
import { getAnswerTabContent } from './webview/getAnswerTabContent';
import * as path from 'path';
import * as fs from 'fs';
import { output_log } from './utils/outputChannelManager';

export const PROMPTS_FILE = path.join(vscode.workspace.rootPath || '', '.vscode', 'prompts.json');
export const SETUPS_FILE = path.join(vscode.workspace.rootPath || '', '.vscode', 'setups.json');
export const HISTORY_FILE = path.join(vscode.workspace.rootPath || '', '.vscode', 'history.json');
export const MEMBER_ICON_FOLDER = path.join(vscode.workspace.rootPath || '', '.vscode', 'icons');

let currentRosterPanel: vscode.WebviewPanel | undefined;
let currentPromptPanel: vscode.WebviewPanel | undefined;
let currentSetupPanel: vscode.WebviewPanel | undefined;
let currentAnswerPanel: vscode.WebviewPanel | undefined;

let promptCollectionViewProvider: PromptCollectionViewProvider | undefined;
let setupCollectionViewProvider: SetupCollectionViewProvider | undefined;
let projectViewProvider: ProjectViewProvider | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	updatePromptsFile(context);

	// Load the prompts and setups when the extension is activated
	const prompts = all_prompts();
	context.globalState.update('prompts', prompts);

	const setups = load_setups(context);
	context.globalState.update('setups', setups);

	projectViewProvider = new ProjectViewProvider(context);
	vscode.window.registerTreeDataProvider('projectView', projectViewProvider);

	setupCollectionViewProvider = new SetupCollectionViewProvider(context);
	vscode.window.registerTreeDataProvider('setupCollectionView', setupCollectionViewProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('frogteam.refreshSetupView', () => {
			setupCollectionViewProvider?.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('frogteam.openSetupPanel', (item: vscode.TreeItem) => {
			setupCollectionViewProvider?.handleItemSelection(item);
		})
	);

	promptCollectionViewProvider = new PromptCollectionViewProvider(context);
	vscode.window.registerTreeDataProvider('promptCollectionView', promptCollectionViewProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('frogteam.refreshPromptView', () => {
			promptCollectionViewProvider?.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('frogteam.openPromptPanel', (item: vscode.TreeItem) => {
			promptCollectionViewProvider?.handleItemSelection(item);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('frogteam.openProjectView', () => {
			vscode.commands.executeCommand('workbench.view.extension.projectView');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('frogteam.openTeamLineupView', () => {
			vscode.commands.executeCommand('workbench.view.extension.teamLineupView');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('frogteam.openView', (item: vscode.TreeItem) => {
			projectViewProvider?.handleItemSelection(item);
		})
	);
}

export function updatePromptsFile(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const vscodeDir = path.join(workspaceRoot, '.vscode');
        const promptsFilePath = path.join(vscodeDir, 'prompts.json');
        const defaultPromptsFilePath = context.asAbsolutePath(path.join('resources', 'prompts.json'));

        // Create .vscode directory and copy prompts.json if it doesn't exist
        if (!fs.existsSync(promptsFilePath)) {
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir);
            }

            fs.copyFileSync(defaultPromptsFilePath, promptsFilePath);
            vscode.window.showInformationMessage('Default prompts.json has been created in the .vscode directory.');
        } else {
            // Read existing prompts
            const existingPrompts = JSON.parse(fs.readFileSync(promptsFilePath, 'utf-8'));

            // Read default prompts
            const defaultPrompts = JSON.parse(fs.readFileSync(defaultPromptsFilePath, 'utf-8'));

            // Create a map of existing prompts by ID for quick lookup
            const existingPromptsMap = new Map<string, any>();
            existingPrompts.forEach((prompt: any) => {
                existingPromptsMap.set(prompt.id, prompt);
            });

            // Check for missing prompts and add them
            let hasUpdates = false;
            defaultPrompts.forEach((defaultPrompt: any) => {
                if (!existingPromptsMap.has(defaultPrompt.id)) {
                    existingPrompts.push(defaultPrompt);
                    hasUpdates = true;
                }
            });

            // Write the updated prompts back to the file if there were any updates
            if (hasUpdates) {
                fs.writeFileSync(promptsFilePath, JSON.stringify(existingPrompts, null, 2), 'utf-8');
                vscode.window.showInformationMessage('prompts.json has been updated with missing prompts.');
            }
        }
    }
}

export async function openAnswerPanel(context: vscode.ExtensionContext, data: HistoryEntry) {
	if (currentAnswerPanel !== undefined) {
		currentAnswerPanel.reveal(vscode.ViewColumn.One);
	} else {
		const iconPath = vscode.Uri.file(
			path.join(context.extensionPath, 'resources', 'icon.png')
		);
		currentAnswerPanel = vscode.window.createWebviewPanel(
			'answer',
			'Answer',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(context.extensionPath)]
			}
		);

		currentAnswerPanel.iconPath = iconPath;
	}
	const documentContent = await getAnswerTabContent(context.extensionUri, data);
	currentAnswerPanel.webview.html = documentContent;

	// Handle messages from the webview
	currentAnswerPanel.webview.onDidReceiveMessage(async (message: { command: string; member: string; text: string, history_id: string }) => {
		switch (message.command) {
			case 'submitTask':
				output_log(`Received "submitTask" command for member: ${message.member}, with text: ${message.text}, and history id: ${message.history_id}.`);
				break;
		}
	});
	const setups: Setup[] = context.globalState.get('setups', []);
	currentAnswerPanel.webview.postMessage({ command: 'loadMembers', setups: setups });

	currentAnswerPanel.onDidDispose(
		() => {
			currentAnswerPanel = undefined;
		},
		null,
		context.subscriptions
	);
}

export async function openPromptPanel(context: vscode.ExtensionContext, data: Prompt) {
	if (currentPromptPanel !== undefined) {
		currentPromptPanel.reveal(vscode.ViewColumn.One);
	} else {
		// `${data.category}-${data.role}-${data.models}`
		currentPromptPanel = vscode.window.createWebviewPanel(
			'prompt',
			"prompt editor",
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(context.extensionPath)]
			}
		);
	}
	const iconPath = vscode.Uri.file(
		path.join(context.extensionPath, 'resources', 'icon.png')
	);
	currentPromptPanel.iconPath = iconPath;
	const local_resources = currentPromptPanel.webview.asWebviewUri(context.extensionUri).toString();
	const documentContent = getPromptDocContent(context.extensionUri, local_resources);
	currentPromptPanel.webview.html = documentContent;
	// Handle messages from the webview
	currentPromptPanel.webview.onDidReceiveMessage(async (message: { command: string; prompt: Prompt }) => {
		switch (message.command) {
			case 'savePrompt':
				savePrompt(message.prompt);
				projectViewProvider?.refresh();
				break;
			case 'deletePrompt':
				deletePrompt(message.prompt.id);
				currentPromptPanel?.dispose();
				currentPromptPanel = undefined;
				break;
		}
		const prompts = all_prompts();
		context.globalState.update('prompts', prompts);
		promptCollectionViewProvider?.refresh();
	});
	currentPromptPanel.webview.postMessage({ command: 'load', prompt: data });

	currentPromptPanel.onDidDispose(
		() => {
			currentPromptPanel = undefined;
		},
		null,
		context.subscriptions
	);
}

export function openRosterPanel(context: vscode.ExtensionContext) {
	if (currentRosterPanel !== undefined) {
		currentRosterPanel.reveal(vscode.ViewColumn.One);
	} else {
		const iconPath = vscode.Uri.file(
			path.join(context.extensionPath, 'resources', 'icon.png')
		);

		currentRosterPanel = vscode.window.createWebviewPanel(
			'lineup',
			'Lineup',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(context.extensionPath)]
			}
		);

		currentRosterPanel.iconPath = iconPath;
		currentRosterPanel.webview.html = getRosterDocContent(context);

		currentRosterPanel.onDidDispose(
			() => {
				currentRosterPanel = undefined;
			},
			null,
			context.subscriptions
		);
	}
}

export async function openSetupPanel(context: vscode.ExtensionContext, data: Setup) {
	if (currentSetupPanel !== undefined) {
		currentSetupPanel.reveal(vscode.ViewColumn.One);
	} else {
		// `${data.category}-${data.role}-${data.models}`
		currentSetupPanel = vscode.window.createWebviewPanel(
			'setup',
			"model member",
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(context.extensionPath)]
			}
		);
	}
	const iconPath = vscode.Uri.file(
		path.join(context.extensionPath, 'resources', 'icon.png')
	);
	const nonce = getNonce();
	currentSetupPanel.iconPath = iconPath;
	const local_resources = currentSetupPanel.webview.asWebviewUri(context.extensionUri).toString();
	const documentContent = getSetupDocContent(context.extensionUri, local_resources);
	currentSetupPanel.webview.html = documentContent;
	// Handle messages from the webview
	currentSetupPanel.webview.onDidReceiveMessage(async (message: { command: string; setup: Setup }) => {
		switch (message.command) {
			case 'saveSetup':
				saveSetup(context, message.setup);
				setupCollectionViewProvider?.refresh();
				break;
			case 'deleteSetup':
				deleteSetup(context, message.setup.id);
				currentSetupPanel?.dispose();
				currentSetupPanel = undefined;
				break;
		}
		load_setups(context); //timing hack
		setupCollectionViewProvider?.refresh();
	});
	currentSetupPanel.webview.postMessage({ command: 'load', setup: data });

	currentSetupPanel.onDidDispose(
		() => {
			currentSetupPanel = undefined;
		},
		null,
		context.subscriptions
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
