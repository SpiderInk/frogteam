import * as vscode from 'vscode';
import * as fs from 'fs';
import { output_log } from '../utils/outputChannelManager';

/**
 * Searches for files matching the given pattern and containing the specified search term.
 * @param searchTerm The term to search for within the files.
 * @param filePattern The file pattern to match (default is '*' for all files).
 * @returns A promise that resolves to an array of VSCode URI objects representing the matching files.
 */
export async function searchFiles(searchTerm: string, filePattern: string = '*'): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error('No workspace folders found');
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const globPattern = new vscode.RelativePattern(rootPath, `**/${filePattern}`);

    try {
        const files = await vscode.workspace.findFiles(globPattern);
        const results: string[] = [];

        for (const file of files) {
            try {
                const content = await fs.promises.readFile(file.fsPath, 'utf8');
                if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push(file.fsPath);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`search.searchFiles: Error reading file ${file.fsPath}: ${error}.`);
                output_log(`search.searchFiles: Error reading file ${file.fsPath}: ${error}.`);
            }
        }

        return getResultsAsXml(results);
    } catch (error) {
        vscode.window.showErrorMessage(`search.searchFiles: Error searching files: ${error}`);
        output_log(`search.searchFiles: Error searching files: ${error}`);
        throw error;
    }
}

export function getResultsAsXml(files: string[]): string {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<projectFiles>\n';
    files.forEach(file => {
        xmlContent += `  <file>${file}</file>\n`;
    });
    xmlContent += '</projectFiles>';
    return xmlContent;
}