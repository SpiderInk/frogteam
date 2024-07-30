import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { marked } from 'marked';
import { Prompt, all_prompts } from '../utils/prompts';
import { Setup } from '../utils/setup';

export function getRosterDocContent(context: vscode.ExtensionContext): string {
    const htmlFilePath = path.join(context.extensionUri.fsPath, 'resources', 'roster.html');
    try {
        let html = fs.readFileSync(htmlFilePath, 'utf8');

        const prompts:Prompt[] = all_prompts();
        const setups:Setup[] = context.globalState.get('setups', []);
        let content = "<h1>Team Lineup</h1>";
        setups.forEach(rp => {
            content += "<hr>";
            content += `<h2 style="color: ${rp.color}">${rp.name}</h2>`;
            content += `<h3>Category: ${rp.purpose}, Model: (${rp.model})</h3>`;
            const prompt = prompts.find(p => p.category === rp.purpose && p.models === rp.model);
            if(prompt !== undefined) {
                content += "<h2>Aligned Prompt</h2>";
                content += `<h3>Category: ${prompt.category}, Model: (${prompt.models})</h3>`;
                content += `<div class="prompt">${marked(prompt.content)}</div>`;
            }
        });
        html = html.replace(/\${markdown}/g, content);
        return html;
    } catch (error) {
        console.error(`Error reading HTML file: ${error}`);
        return `<html><body><h1>Error loading HTML file</h1></body></html>`;
    }
}