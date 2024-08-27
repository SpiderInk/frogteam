import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const PROJECTS_FILE = path.join(vscode.workspace.rootPath || '', '.vscode', 'projects.json');
const vscodeDirectory = path.join(__dirname, '..', '.vscode');

// Ensure the .vscode directory exists
if (!fs.existsSync(vscodeDirectory)) {
    fs.mkdirSync(vscodeDirectory);
}

// Initialize projects.json if it doesn't exist
if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects: [] }, null, 4));
}

// Function to add a new project
export function addProjectToFile(projectName: string, projectDirectory: string, projectDescription: string) {
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
    if (fs.existsSync(PROJECTS_FILE)) {
        const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
        return projectsData.projects || [];
    }
    return [];
}