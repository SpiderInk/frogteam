import * as fs from 'fs';

export function generateSvgIcon(color: string, outputPath: string): void {
    const svgContent = `
    <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="50" height="50" fill="${color}" />
    </svg>
    `;

    fs.writeFileSync(outputPath, svgContent);
}

export function generateUniqueId() {
    return 'xxxx-xxxx-4xxx-yxxx-xxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};