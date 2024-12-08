import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as lockfile from 'proper-lockfile';
import { output_log } from '../utils/outputChannelManager';
import { getWorkspaceFolder } from '../utils/common';

// Wrapper for file operations with locking
class FileOperationManager {
    private static instance: FileOperationManager;
    private lockOptions = { 
        retries: {
            retries: 10,        // Increased from 5
            factor: 1.5,        // Decreased from 2
            minTimeout: 50,     // Decreased from 100
            maxTimeout: 1000,
            randomize: true     // Added randomization
        },
        stale: 10000,          // Added stale lock timeout
        realpath: false        // Added to prevent realpath resolution issues
    };

    private constructor() {}

    public static getInstance(): FileOperationManager {
        if (!FileOperationManager.instance) {
            FileOperationManager.instance = new FileOperationManager();
        }
        return FileOperationManager.instance;
    }

    // Ensure directory exists
    private async ensureDirectoryExists(filePath: string): Promise<void> {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    public async createAndOpenFile(fileName: string, fileContent: string): Promise<string> {
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
    
            // Ensure directory exists
            await this.ensureDirectoryExists(filePath);
    
            // Create an empty file if it doesn't exist
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, '');  // Create empty file for locking
            }
    
            // Acquire file lock
            const release = await lockfile.lock(filePath, this.lockOptions);
            
            try {
                const fileUri = vscode.Uri.file(filePath);
                await vscode.workspace.fs.writeFile(fileUri, Buffer.from(fileContent, 'utf8'));
    
                // Log the path and file existence for debugging
                output_log(`File path: ${filePath}`);
                output_log(`File exists after write: ${fs.existsSync(filePath)}`);
    
                const document = await vscode.workspace.openTextDocument(fileUri);
                await vscode.window.showTextDocument(document);
    
                output_log(`File ${fileName} created and opened successfully.`);
                return `${fileName} written successfully.`;
            } finally {
                // Always release the lock
                await release();
            }
        } catch (err) {
            const error = err as Error;
            // More detailed error logging
            output_log(`Failed to create and open file: ${error.message}`);
            output_log(`Error stack: ${error.stack}`);
            if (error instanceof Error && 'code' in error) {
                output_log(`Error code: ${(error as any).code}`);
            }
            vscode.window.showErrorMessage(`Failed to create and open file: ${error.message}`);
            return `${fileName} operation failed.`;
        }
    }

    // Read file content with locking
    public async getContent(file: string): Promise<string> {
        const fullPath = `${getWorkspaceFolder()}/${file}`;
        
        if (!fs.existsSync(fullPath)) {
            output_log(`File not found: ${fullPath}`);
            return '';
        }

        try {
            // Acquire shared lock for reading
            const release = await lockfile.lock(fullPath, {
                ...this.lockOptions,
                shared: true
            });

            try {
                const data = fs.readFileSync(fullPath, 'utf8');
                output_log(`${file} read successfully`);
                return data;
            } finally {
                // Always release the lock
                await release();
            }
        } catch (err) {
            console.error(`Error reading file: ${err}`);
            return '';
        }
    }

    // Save content with locking
    public async save(content: string, file: string): Promise<string> {
        return await this.createAndOpenFile(file, content);
    }

    // Save JSON with locking
    public async saveJsonToFile(filePath: string, json: any): Promise<void> {
        const jsonData = JSON.stringify(json, null, 2);
        
        return new Promise(async (resolve, reject) => {
            try {
                // Ensure directory exists
                await this.ensureDirectoryExists(filePath);

                // Acquire file lock
                const release = await lockfile.lock(filePath, this.lockOptions);

                try {
                    fs.writeFileSync(filePath, jsonData);
                    output_log(`${filePath} written successfully.`);
                    resolve();
                } finally {
                    // Always release the lock
                    await release();
                }
            } catch (err) {
                output_log(`Error writing to file: ${err}`);
                reject(err);
            }
        });
    }
}

// Singleton instance for easy import
const fileOps = FileOperationManager.getInstance();

export function getcontent(file: string): Promise<string> {
    return fileOps.getContent(file);
}

export function save(content: string, file: string): Promise<string> {
    return fileOps.save(content, file);
}

export function saveJsonToFile(filePath: string, json: any): Promise<void> {
    return fileOps.saveJsonToFile(filePath, json);
}

export async function createAndOpenFile(fileName: string, fileContent: string): Promise<string> {
    return fileOps.createAndOpenFile(fileName, fileContent);
}