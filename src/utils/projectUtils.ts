import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getWorkspaceFolder } from '../utils/common';

const PROJECTS_FILE = path.join(getWorkspaceFolder() || '', '.vscode', 'frogteam', 'projects.json');
const vscodeFrogteamDirectory = path.join(getWorkspaceFolder() || '', '.vscode', 'frogteam');

// Ensure the .vscode/frogteam directory exists
if (!fs.existsSync(vscodeFrogteamDirectory)) {
    fs.mkdirSync(vscodeFrogteamDirectory, { recursive: true });
}

function createProjectFile() {
    // Initialize projects.json if it doesn't exist
    if (!fs.existsSync(PROJECTS_FILE)) {
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects: [        {
            "projectName": "no-project",
            "projectDirectory": "",
            "projectDescription": "Homeless history items go here. This should be just the items that are created from talking to a team member on their configuration page."
        }] }, null, 4));
    }
}

// Function to add a new project
export function addProjectToFile(projectName: string, projectDirectory: string, projectDescription: string) {
    createProjectFile();
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
    const existingProject = projectsData.projects.find((p: any) => p.projectName === projectName);

    if (!existingProject) {
        projectsData.projects.push({ projectName, projectDirectory, projectDescription });
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsData, null, 4));
    }
}

export function package_project(name: string, directory: string, problem: string): string {
    return `<project>
<name>${name}</name>
<directory>${directory}</directory>
<problem>${problem}</problem>
</project>`;
}

export function getProjects(): any[] {
    createProjectFile();
    if (fs.existsSync(PROJECTS_FILE)) {
        const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
        return projectsData.projects || [];
    }
    return [];
}