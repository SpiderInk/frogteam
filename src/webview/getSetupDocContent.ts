import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getNonce } from './getNonce';

export function getSetupDocContent(extensionUri: vscode.Uri): string {
    const htmlFilePath = path.join(extensionUri.fsPath, 'resources', 'setup.html');
    try {
        let html = fs.readFileSync(htmlFilePath, 'utf8');
        const nonce = getNonce();
        html = html.replace(/\${nonce}/g, nonce);  
        return html;
    } catch (error) {
        console.error(`Error reading HTML file: ${error}`);
        return `<html><body><h1>Error loading HTML file</h1></body></html>`;
    }
}