import * as fs from 'fs';
import { ProjectViewProvider } from '../views/projectView';

interface HistoryEntry {
    ask_by: string;
    response_by: string;
    timestamp: string;
    model: string;
    ask: string;
    answer: string;
    markdown?: boolean;
}

class HistoryManager {
    private filePath: string;
    private history: HistoryEntry[];
    private provider: ProjectViewProvider;

    constructor(filePath: string, our_provider: ProjectViewProvider) {
        this.provider = our_provider;
        this.filePath = filePath;
        this.history = [];
        this.loadHistory();
    }

    private loadHistory(): void {
        if (fs.existsSync(this.filePath)) {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            this.history = JSON.parse(data);
        } else {
            this.saveHistory();
        }
    }

    private saveHistory(): void {
        const data = JSON.stringify(this.history, null, 2);
        fs.writeFileSync(this.filePath, data, 'utf-8');
    }

    private markDownResponse(response: string): boolean {
        return response.includes('\n');
    }

    public addEntry(askBy: string, responseBy: string, model: string, ask: string, answer: string): void {
        const entry: HistoryEntry = {
            ask_by: askBy,
            response_by: responseBy,
            timestamp: new Date().toISOString(),
            model: model,
            ask: ask,
            answer: answer,
            markdown: this.markDownResponse(answer)
        };
        this.history.push(entry);
        this.saveHistory();
        this.provider.refresh();
    }

    public getHistory(): HistoryEntry[] {
        return this.history;
    }

    public getHistoryGroupedByDate(): Record<string, HistoryEntry[]> {
        return this.history.reduce((acc, entry) => {
            const date = new Date(entry.timestamp).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(entry);
            return acc;
        }, {} as Record<string, HistoryEntry[]>);
    }
}

export { HistoryManager, HistoryEntry };