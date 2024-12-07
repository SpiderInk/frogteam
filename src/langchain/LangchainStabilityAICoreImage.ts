import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Setup } from '../utils/setup';
import { HistoryManager, LookupTag } from '../utils/historyManager';
import { getProjectDirectory } from '../utils/projectUtils';
import { output_log } from '../utils/outputChannelManager';
import { fetchPrompts, personalizePrompt } from '../utils/prompts';

async function saveBase64Image(base64Image: string, saveDirectory: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (saveDirectory.startsWith("/") || saveDirectory.startsWith("..")) {
            reject("Invalid saveDirectory, just provide a name and it will be created relative to the project.");
            return;
        }

        let wsPath: string;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            wsPath = path.join(workspacePath, saveDirectory);
        } else {
            const tempDir = os.tmpdir();
            wsPath = path.join(tempDir, saveDirectory);
        }

        // Ensure the saveDirectory exists, if not create it
        if (!fs.existsSync(wsPath)) {
            fs.mkdirSync(wsPath, { recursive: true });
        }

        const filePath = path.resolve(wsPath, fileName);

        // Remove the base64 prefix if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

        try {
            fs.writeFileSync(filePath, base64Data, 'base64');
            resolve(filePath);
        } catch (error) {
            reject(`Failed to save image: ${error}`);
        }
    });
}

export async function generateBedrockStabilityImage(
    caller: string,
    awsRegion: string,
    member_object: Setup,
    question: string,
    historyManager: HistoryManager,
    setups: Setup[],
    conversationId: string,
    parentId: string | undefined,
    project: string
): Promise<string> {
    // Create Bedrock Runtime Client
    const client = new BedrockRuntimeClient({
        region: awsRegion
    });

    // Fetch and personalize prompt if available
    let image_prompt = question;
    const image_prompt_obj = fetchPrompts('graphics', 'graphic-artist', member_object?.model);
    if (image_prompt_obj.length > 0) {
        image_prompt = image_prompt_obj[0].content;
        image_prompt = personalizePrompt(image_prompt, { question: question });
    }

    const requestBody = JSON.stringify({
        "prompt": image_prompt,
        "mode": "text-to-image",
        "aspect_ratio": "1:1",
        "output_format": "jpeg"
    });

    try {
        const input = { // InvokeModelRequest
            body: requestBody,
            contentType: "application/json",
            accept: "application/json",
            modelId: "stability.stable-image-core-v1:0",
        };
        const command = new InvokeModelCommand(input);
        const response = await client.send(command);

        // Parse the response
        const responseBody = new TextDecoder().decode(response.body);
        const parsedResponse = JSON.parse(responseBody);

        // Extract base64 image
        const base64Image = parsedResponse.images[0];

        // Determine save directory
        let dir = getProjectDirectory(project);
        if (dir === null || dir?.length === 0) {
            dir = member_object?.name ?? "no-data";
        }

        let file: string = "";
        // Save image to file
        if (dir !== null) {
            const guid: string = uuidv4();
            file = await saveBase64Image(base64Image, dir, `${guid}.png`);
        }

        // Log history entry
        const parent_id = historyManager.addEntry(
            caller,
            member_object?.name ?? "no-data",
            member_object?.model ?? "no-model",
            image_prompt,
            "",
            LookupTag.MEMBER_TASK,
            conversationId,
            parentId,
            project
        );

        return file;
    } catch (error) {
        output_log(`Bedrock Image Generation Error: ${JSON.stringify(error)}`);
        vscode.window.showErrorMessage((error as any).message);
        return {} as any;
    }
}