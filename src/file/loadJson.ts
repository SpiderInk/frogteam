import * as fs from 'fs';

export function loadJsonFromFileSync(filePath: string): any[] {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } else {
            return [];
        }
    } catch (err) {
        console.error(`Error reading JSON file: ${err}`);
        return [];
    }
}