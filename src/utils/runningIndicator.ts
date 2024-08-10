
import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

export function showRunningIndicator(msg: String) {
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    }
    statusBarItem.text = `$(sync~spin) ${msg}...`;
    statusBarItem.show();
}

export function hideRunningIndicator() {
    if (statusBarItem) {
        statusBarItem.hide();
    }
}

// Call `showRunningIndicator` when your process starts
// Call `hideRunningIndicator` when your process ends