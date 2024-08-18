import * as fs from 'fs';
import { ProjectViewProvider } from '../views/projectView';
import { output_log } from './outputChannelManager';
import { HISTORY_FILE } from '../extension';

export enum LookupTag {
    PROJECT_DESC = 'ProjectDescription',
    MEMBER_TASK = 'MemberTask',
    PROJECT_RESP = 'ProjectResponse',
    MEMBER_RESP = 'MemberResponse',
    TOOL_RESP = 'ToolOutput',
}

interface TreeNode {
    id: string;
    label: string;
    children: TreeNode[];
    entry?: HistoryEntry;
}

interface HistoryEntry {
    ask_by: string;
    response_by: string;
    timestamp: string;
    model: string;
    ask: string;
    answer: string;
    markdown?: boolean;
    lookupTag: LookupTag;
    conversationId: string;
    parentConversationId: string | undefined;
}

class HistoryManager {
    private filePath: string;
    private history: HistoryEntry[];
    private provider: ProjectViewProvider | undefined;

    constructor(filePath: string, our_provider: ProjectViewProvider | undefined) {
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

    public addEntry(askBy: string, responseBy: string, model: string, ask: string, answer: string, lookup_tag: LookupTag, conversation_id: string, parent_id: string | undefined): void {
        const entry: HistoryEntry = {
            ask_by: askBy,
            response_by: responseBy,
            timestamp: new Date().toISOString(),
            model: model,
            ask: ask,
            answer: answer,
            markdown: this.markDownResponse(answer),
            lookupTag: lookup_tag,
            conversationId: conversation_id,
            parentConversationId: parent_id
        };
        this.history.push(entry);
        this.saveHistory();
        if(this.provider !== undefined) {
            this.provider.refresh();
        }
        output_log(`Asked By: ${askBy}, Response By: ${responseBy}, Model: ${model}`);
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

    public buildTreeGroupedByDate(entries: HistoryEntry[]): TreeNode[] {
        const groupedByDate = entries.reduce((acc, entry) => {
            const date = new Date(entry.timestamp).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(entry);
            return acc;
        }, {} as Record<string, HistoryEntry[]>);
    
        const dateNodes: TreeNode[] = [];
    
        for (const [date, entries] of Object.entries(groupedByDate)) {
            const conversationMap = new Map<string, TreeNode>();
    
            // Create TreeNode for each entry
            entries.forEach(entry => {
                conversationMap.set(entry.conversationId, {
                    id: entry.conversationId,
                    label: entry.ask, // Or any other relevant label
                    children: [],
                    entry
                });
            });
    
            // Link children with their parents
            entries.forEach(entry => {
                if (entry.parentConversationId) {
                    const parent = conversationMap.get(entry.parentConversationId);
                    const node = conversationMap.get(entry.conversationId);
                    if (parent && node) {
                        parent.children.push(node);
                    }
                }
            });
    
            // Collect top-level conversations (those without a parent)
            const topLevelNodes = Array.from(conversationMap.values()).filter(node => !entries.some(e => e.conversationId === node.id && e.parentConversationId));
    
            // Create a date node and add the top-level conversation nodes as its children
            dateNodes.push({
                id: date,
                label: date,
                children: topLevelNodes
            });
        }
    
        return dateNodes;
    }
}

function FetchHistory(directory: string): string {
    const historyManager = new HistoryManager(HISTORY_FILE, undefined);
    const history = historyManager.getHistory();

    const result = history
        .filter(entry => 
            [LookupTag.MEMBER_RESP, LookupTag.PROJECT_RESP].includes(entry.lookupTag)
            // && (directory === "" || entry.ask.includes(directory) || entry.answer.includes(directory))
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort by timestamp descending
        .shift(); // Get the first (most recent) entry

    if(result) {
        const response = `At: ${result.timestamp}
***
HumanMessage: ${result.ask} 
***
AIMessage: ${result.answer}`;
        return response;
    }
    return "";
}

export { HistoryManager, HistoryEntry, TreeNode, FetchHistory };