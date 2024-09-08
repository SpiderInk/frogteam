import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface Config {
    mlflow_server_address: string;
}

const DEFAULT_CONFIG: Config = {
    mlflow_server_address: 'http://localhost:5001'
};

function validateConfig(config: any): config is Config {
    if (typeof config !== 'object' || config === null) {
        return false;
    }
    if (typeof config.mlflow_server_address !== 'string') {
        return false;
    }
    return true;
}

export function ensureConfigFileExists(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('No workspace folder found');
    }

    const configFolderPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'frogteam');
    const configFilePath = path.join(configFolderPath, 'config.json');

    if (!fs.existsSync(configFilePath)) {
        // Create the directory if it doesn't exist
        if (!fs.existsSync(configFolderPath)) {
            fs.mkdirSync(configFolderPath, { recursive: true });
        }

        // Write the default configuration
        fs.writeFileSync(configFilePath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
}

function getConfig(): Config {
    ensureConfigFileExists();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('No workspace folder found');
    }

    const configPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'frogteam', 'config.json');
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const loadedConfig = JSON.parse(configContent);
        
        if (!validateConfig(loadedConfig)) {
            throw new Error('Invalid configuration format');
        }
        
        // Merge loaded config with DEFAULT_CONFIG
        return { ...DEFAULT_CONFIG, ...loadedConfig };
    } catch (error) {
        console.error('Error reading config file:', error);
        vscode.window.showErrorMessage(`Failed to read config file: ${error}`);
        return DEFAULT_CONFIG;
    }
}

export function getMlflowServerAddress(): string {
    return getConfig().mlflow_server_address;
}

export function updateConfig(newConfig: Partial<Config>): void {
    const currentConfig = getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('No workspace folder found');
    }

    const configPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'frogteam', 'config.json');

    try {
        fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
        vscode.window.showInformationMessage('Configuration updated successfully');
    } catch (error) {
        console.error('Error writing config file:', error);
        vscode.window.showErrorMessage(`Failed to update config file: ${error}`);
    }
}

export function registerConfigCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('frogteam.updateMlflowServerAddress', async () => {
            const currentAddress = getMlflowServerAddress();
            const newAddress = await vscode.window.showInputBox({
                prompt: 'Enter new MLflow server address',
                value: currentAddress,
                validateInput: (value) => {
                    if (!value) {
                        return 'Address cannot be empty';
                    }
                    if (!value.startsWith('http://') && !value.startsWith('https://')) {
                        return 'Address must start with http:// or https://';
                    }
                    return null;
                }
            });

            if (newAddress) {
                updateConfig({ mlflow_server_address: newAddress });
            }
        })
    );
}

// New function to allow dynamic configuration updates during runtime
export function updateConfigDynamic(key: keyof Config, value: string): void {
    const newConfig: Partial<Config> = { [key]: value };
    updateConfig(newConfig);
}