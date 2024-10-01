/* eslint-disable no-process-env */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { DallEAPIWrapper } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Setup, get_member_purposes_for_prompt } from '../utils/setup';
import { HistoryManager, LookupTag } from '../utils/historyManager';
import { getProjectDirectory } from '../utils/projectUtils';
import { output_log } from '../utils/outputChannelManager';
import { PromptExperiment } from '../mlflow/promptExperiment';
import { getMlflowServerAddress } from '../utils/config';
import { fetchPrompts, personalizePrompt } from '../utils/prompts';

/* 
    creates a base64 image
    writes image to disc
    returns the image path
*/

async function downloadFile(url: string, saveDirectory: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if(saveDirectory.startsWith("/") || saveDirectory.startsWith("..")){
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
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(`Failed to get '${url}' (${response.statusCode})`);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filePath);  // Resolve with the file path when done
            });
        }).on('error', (error) => {
            fs.unlink(filePath, () => reject(error.message)); // Delete the file if an error occurred during download
        });
    });
}

export async function generateLangchainDalleImage(caller: string, apikey: string, member_object: Setup, question: string, historyManager: HistoryManager, setups: Setup[], conversationId: string, parentId: string | undefined, project: string): Promise<string> {
    // let duration = 0;
    // const promptExperiment = new PromptExperiment(getMlflowServerAddress());

    // I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:
    // SEE: https://platform.openai.com/docs/guides/images/prompting
    
    const tool = new DallEAPIWrapper({
        n: 1, // Default
        model: member_object.model, //  "dall-e-3", // Default
        apiKey: apikey, // Default
    });

    // const prompt = `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: ${question}`;
    const prompt = `${question}`;
    const image_url = await tool.invoke(prompt);
    let dir = getProjectDirectory(project);
    if(dir?.length === 0) {
        dir = member_object?.name ?? "no-data";
    }

    let file: string = "";
    // download image here
    // project directory
    if(dir !== null ) {
        const guid: string = uuidv4();
        file = await downloadFile(image_url, dir, `${guid}.png`);
    }
    // start the the mlflow run for the main prompt's conversation cycle
    // const engineer_prompt_experiment_id = await promptExperiment.startRunAndLogPrompt(engineer_prompt_obj[0]);
    // console.log(imagedata);
    // await promptExperiment.endRunAndLogPromptResult(engineer_prompt_experiment_id, JSON.stringify(messages), duration);
    const parent_id = historyManager.addEntry(caller, member_object?.name ?? "no-data", member_object?.model ?? "no-model", prompt, "", LookupTag.MEMBER_TASK, conversationId, parentId, project);

    return file;
}