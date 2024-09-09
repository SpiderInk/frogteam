import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getNonce } from './getNonce';
import { commonWebPanelComponents } from '../utils/common';

export function getSetupDocContent(extensionUri: vscode.Uri, webView: vscode.Webview, local_resources: string): string {
    const htmlFilePath = path.join(extensionUri.fsPath, 'resources', 'setup.html');
    const parts = commonWebPanelComponents(extensionUri);
    try {
        const css = webView.asWebviewUri(parts.css).toString();
        const jss = webView.asWebviewUri(parts.jss).toString();
        let html = fs.readFileSync(htmlFilePath, 'utf8');
        const nonce = getNonce();
        html = html.replace(/\${nonce}/g, nonce);
        html = html.replace(/\${local_resources}/g, local_resources);
        html = html.replace(/\${cssUri}/g, css);
        html = html.replace(/\${jsUri}/g, jss);
        html = html.replace(/\${cspSource}/g, webView.cspSource);
        return html;
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading HTML file: ${error}`);
        return `<html><body><h1>Error loading HTML file</h1></body></html>`;
    }
}