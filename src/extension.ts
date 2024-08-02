// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { marked } from 'marked';
import { getNonce } from './webview/getNonce';
import { getRosterDocContent } from './webview/getRosterDocContent';
import { getPromptDocContent } from './webview/getPromptDocContent';
import { HistoryManager, HistoryEntry } from './utils/historyManager';
import { Prompt, savePrompt, all_prompts, deletePrompt, validatePrompts } from './utils/prompts';
import { ProjectViewProvider, HistoryItem } from './views/projectView';
import { SetupCollectionViewProvider } from './views/setupCollectionView';
import { PromptCollectionViewProvider } from './views/promptCollectionView';
import { load_setups, Setup, saveSetup, deleteSetup } from './utils/setup';
import { getSetupDocContent } from './webview/getSetupDocContent';
import * as path from 'path';

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
	const date = new Date(data.timestamp);
	const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

	const markdownContent = marked(data.answer);
	const documentContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.response_by}</title>
</head>
<body>
<br><br>
<strong>Response From: ${data.response_by} at ${formattedTime} on ${formattedDate}</strong>
<br><br>
${markdownContent}
</body>
</html>`;

	currentAnswerPanel.webview.html = documentContent;

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
	const nonce = getNonce();
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
