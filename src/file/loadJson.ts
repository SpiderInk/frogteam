import * as fs from 'fs';

export function loadJsonFromFileSync(filePath: string): any[] {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            try {
                return JSON.parse(data);
            } catch (jsonErr) {
                console.error(`Error parsing JSON file: ${jsonErr}`);
                return [];
            }
        } else {
            return [];
        }
    } catch (err) {
        console.error(`Error reading JSON file: ${err}`);
        return [];
    }
}