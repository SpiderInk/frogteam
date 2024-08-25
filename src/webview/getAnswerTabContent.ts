import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getNonce } from './getNonce';
import { HistoryEntry } from '../utils/historyManager';
import { marked } from 'marked';

export async function getAnswerTabContent(extensionUri: vscode.Uri, data: HistoryEntry): Promise<string> {
    const htmlFilePath = path.join(extensionUri.fsPath, 'resources', 'answer.html');
    try {

        const date = new Date(data.timestamp);
        const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        let markdownContent;
        if(data.answer.length > 0) {
            markdownContent = await marked(data.answer);
        } else {
            markdownContent = data.answer;
        }

        let html = fs.readFileSync(htmlFilePath, 'utf8');
        const nonce = getNonce();
        html = html.replace(/\${nonce}/g, nonce);
        html = html.replace(/\${response_by}/g, data.response_by);
        html = html.replace(/\${lookupTag}/g, data.lookupTag);
        html = html.replace(/\${formattedTime}/g, formattedTime);
        html = html.replace(/\${formattedDate}/g, formattedDate);
        html = html.replace(/\${ask_by}/g, data.ask_by);
        html = html.replace(/\${ask}/g, data.ask);
        html = html.replace(/\${markdownContent}/g, markdownContent);
        html = html.replace(/\${history_id}/g, data.id);

        return html;
    } catch (error) {
        console.error(`Error reading HTML file: ${error}`);
        return `<html><body><h1>Error loading HTML file</h1></body></html>`;
    }
}