import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function generateSvgIcon(color: string, outputPath: string): void {
    const svgContent = `
    <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="50" height="50" fill="${color}" />
    </svg>
    `;

    fs.writeFileSync(outputPath, svgContent);
}

export function generateUniqueId() {
    return 'xxxx-xxxx-4xxx-yxxx-xxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function generateShortUniqueId() {
    return 'xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function fetchApiKey(apiKey: string): string {
    // Check if apiKey starts with "ENV="
    if (apiKey.startsWith("ENV=")) {
        // Split on the '=' character
        const envVarName = apiKey.split("=")[1];

        // Fetch the value of the environment variable
        const envVarValue = process.env[envVarName];

        // Return the value of the environment variable if it exists, otherwise apiKey
        return envVarValue || apiKey;
    } else {
        // If apiKey does not start with "ENV=", return it as is
        return apiKey;
    }
}

export function commonWebPanelComponents(extensionUri: vscode.Uri): { css: vscode.Uri; jss: vscode.Uri; } {
    const cssPath = vscode.Uri.joinPath(extensionUri, 'resources', 'common.css');
    const jsPath = vscode.Uri.joinPath(extensionUri, 'resources', 'common.js');

    return {
        css: cssPath,
        jss: jsPath
    };
}

export function getWorkspaceFolder(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return workspaceFolders[0].uri.fsPath;
    }
    throw new Error("No workspace folder found");
}