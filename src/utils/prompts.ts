import * as vscode from 'vscode';
import { PROMPTS_FILE } from '../extension';
import { loadJsonFromFileSync } from '../file/loadJson';
import { saveJsonToFile } from '../file/fileOperations';
import { getProjectFilesAsXml } from './listfiles';
import { generateUniqueId } from './common';

const REQUIRED_PROMPTS = [
    { category: "lead-architect", role: "system" },
    { category: "lead-engineer", role: "system" },
    { category: "developer", role: "system" }
];

let PROMPTS: Prompt[] = [];

export interface Prompt {
    id: string;
    role: string;
    content: string;
    category: string;
    models: string;
    active: boolean;
    tag: string;
    ml_experiment_id?: string;
}

export function newPrompt(context: vscode.ExtensionContext): Prompt {
    let new_prompt:Prompt = {
        id: generateUniqueId(),
        role: '',
        content: '',
        category: '',
        models: '',
        active: false,
        tag: ''
    };
    savePrompt(new_prompt);
    const prompts: Prompt[] = context.globalState.get('prompts', []);
    prompts.push(new_prompt);
    // context.globalState.update('setups', new_prompt);
    return new_prompt;
}

export function validatePrompts() {
    if(PROMPTS.length === 0) {
        loadPrompts();
    }
    return REQUIRED_PROMPTS.filter(rp => !PROMPTS.some(p => p.category === rp.category && p.role === rp.role && p.active === true));
}

export function all_prompts() {
    if(PROMPTS.length === 0) {
        loadPrompts();
    }
    return PROMPTS;
}

export function fetchPrompts(role: string, category: string, model: string): Prompt[] {
    if(PROMPTS.length === 0) {
        loadPrompts();
    }
    return PROMPTS.filter(prompt =>
        prompt.role === role &&
        prompt.category === category &&
        (prompt.models === "*" || prompt.models.includes(model)) &&
        prompt.active === true
    );
}

export function personalizePrompt(prompt: string, replacements: { [key: string]: string }): string {
    // all prompts get the project file roster for now
    const files = getProjectFilesAsXml();
    replacements.file_list = files;
    return new Function(...Object.keys(replacements), `return \`${prompt}\`;`)(...Object.values(replacements));
}

export function loadPrompts() {
    PROMPTS = loadJsonFromFileSync(PROMPTS_FILE);
}

export async function savePrompts(prompts: Prompt[]) {
    await saveJsonToFile(PROMPTS_FILE, prompts);
    loadPrompts();
}

export function savePrompt(prompt: Prompt) {
    loadPrompts();
    const index = PROMPTS.findIndex(element => element.id === prompt.id);
    if (index === -1 && prompt.id.length > 0) {
        PROMPTS.push(prompt);
    } else {
        PROMPTS[index] = prompt;
    }
    savePrompts(PROMPTS);
}

export function deletePrompt(id: string) {
    if (PROMPTS.length === 0) {
        loadPrompts();
    }
    const updatedPrompts = PROMPTS.filter(prompt => prompt.id !== id);
    savePrompts(updatedPrompts);
}