import * as fs from 'fs';
import * as path from 'path';
import { MEMBER_ICON_FOLDER } from "../extension";
import { generateSvgIcon } from "./common";
import { loadJsonFromFileSync } from '../file/loadJson';
import { SETUPS_FILE } from '../extension';
import { saveJsonToFile } from '../file/fileOperations';

export interface Setup {
    name: string;
    purpose: string;
    model: string;
    endpoint: string;
    apiKey: string;
    color: string;
    icon: string;
}

export function load_setups(context: any): Setup[] {
    const setups = loadJsonFromFileSync(SETUPS_FILE);
    return setups;
}

export function validate_fixMemberIcons(setups: Setup[]): boolean {
    let allIconsExist = true;

    if (!fs.existsSync(MEMBER_ICON_FOLDER)) {
        fs.mkdirSync(MEMBER_ICON_FOLDER, { recursive: true });
    }

    setups.forEach((setup) => {
        const iconName = `${setup.name}-${setup.color}.svg`;
        const iconPath = path.join(MEMBER_ICON_FOLDER, iconName);

        if (!fs.existsSync(iconPath)) {
            generateSvgIcon(setup.color, iconPath);
            setup.icon = iconPath;
            allIconsExist = false;  // We had to create an icon, so not all icons existed
        }
    });

    return allIconsExist;
}

export function fetchSetupByName(setups: Setup[], name: string): Setup | undefined {
    return setups.find(setup => setup.name === name);
}

export function fetchSetupByPurpose(setups: Setup[], purpose: string): Setup | undefined {
    return setups.find(setup => setup.purpose === purpose);
}

export function get_member_purposes_for_prompt(setups: Setup[]): string {
    let result = '';
    for (const member in setups) {
        if (setups[member].purpose !== 'lead-architect') {
            result += `${setups[member].name}: ${setups[member].purpose}\n`;
        }
    }
    return result;
}

export function extractMemberFromPrompt(prompt: string, setups: Setup[]): string {
    const mentionRegex = /@([a-zA-Z]+)/g; // Regex to find '@' followed by a name
    const matches = prompt.matchAll(mentionRegex);
    const setupNames = setups.map(setup => setup.name);

    for (const match of matches) {
        const memberName = match[1];
        if (setupNames.includes(memberName)) {
            return memberName;
        }
    }

    throw new Error('No valid member name found in the prompt');
}



export async function saveSetup(context: any, setup: Setup) {
    let setups = load_setups(context);
    const index = setups.findIndex(element => element.name === setup.name);
    if (index === -1 && setup.name.length > 0) {
        setups.push(setup);
    } else {
        setups[index] = setup;
    }
    await saveJsonToFile(SETUPS_FILE, setups);
    context.globalState.update('setups', setups);
}
