import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function createAndOpenFile(fileName: string, fileContent: string): Promise<string> {
    try {
        let filePath: string;

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            filePath = path.join(workspacePath, fileName);
        } else {
            const tempDir = os.tmpdir();
            filePath = path.join(tempDir, fileName);
        }

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileUri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(fileContent, 'utf8'));

        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`File ${fileName} created and opened successfully.`);
        return `${fileName} written successfully.`;
    } catch (err) {
        const error = err as Error;
        vscode.window.showErrorMessage(`Failed to create and open file: ${error.message}`);
        return `${fileName} operation failed.`;
    }
}

export function getcontent(file: string): string {
    return load_file_content(file);
}

export async function save(content: string, file: string): Promise<string> {
    return await createAndOpenFile(file, content);
}

export function load_file_content(filePath: string): string {
    try {
        if (fs.existsSync(`${vscode.workspace.rootPath}/${filePath}`)) {
            const data = fs.readFileSync(`${vscode.workspace.rootPath}/${filePath}`, 'utf8');
            return data;
        } else {
            return '';
        }
    } catch (err) {
        console.error(`Error reading file: ${err}`);
        return '';
    }
}

export async function saveJsonToFile(filePath: string, json: any): Promise<void> {
    const jsonData = JSON.stringify(json, null, 2);
    return new Promise((resolve, reject) => {
        fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
            if (err) {
                return reject(err);
            }
            fs.writeFile(filePath, jsonData, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}