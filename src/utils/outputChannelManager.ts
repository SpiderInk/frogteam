import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('FrogTeam.ai');
    }
    return outputChannel;
}

export function output_log(message: string) {
    getOutputChannel().appendLine(message);
}