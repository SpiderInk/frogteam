import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileManager {
    private frogteamDir: string;
    private oldVscodeDir: string;
    private state: { [key: string]: boolean } = {};

    constructor() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        this.frogteamDir = path.join(workspaceFolder, '.vscode', 'frogteam');
        this.oldVscodeDir = path.join(workspaceFolder, '.vscode');
    }

    async initializeFiles() {
        await this.createFrogteamDir();
        await this.copyFiles();
        this.setState('filesCopied', true);
    }

    private async createFrogteamDir() {
        if (!fs.existsSync(this.frogteamDir)) {
            fs.mkdirSync(this.frogteamDir, { recursive: true });
        }
    }

    private async copyFiles() {
        const filesToCopy = ['history.json', 'prompts.json', 'setups.json'];
        for (const file of filesToCopy) {
            const oldPath = path.join(this.oldVscodeDir, file);
            const newPath = path.join(this.frogteamDir, file);
            if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
                fs.copyFileSync(oldPath, newPath);
            }
        }
    }

    private setState(key: string, value: boolean) {
        this.state[key] = value;
    }

    getState(key: string): boolean {
        return this.state[key] || false;
    }
}