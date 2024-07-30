import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const ignoreDirs = new Set(['node_modules', '.git', '.vscode', '__pycache__', 'a-saved']);

function listProjectFiles(directory: string): string[] {
    let fileList: string[] = [];
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const relativePath = path.relative(vscode.workspace.rootPath || '', fullPath);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            if (!ignoreDirs.has(file)) {
                fileList = fileList.concat(listProjectFiles(fullPath));
            }
        } else {
            fileList.push(`${relativePath}`);
        }
    });

    return fileList;
}

export function getProjectFiles(): string[] {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return [];
    }
    const projectRoot = workspaceFolders[0].uri.fsPath;
    return listProjectFiles(projectRoot);
}

export function getProjectFilesAsXml(): string {
    const files = getProjectFiles();
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<projectFiles>\n';
    files.forEach(file => {
        xmlContent += `  <file>${file}</file>\n`;
    });
    xmlContent += '</projectFiles>';
    return xmlContent;
}