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
    id: string;
    ask_by: string;
    response_by: string;
    timestamp: string;
    model: string;
    ask: string;
    answer: string;
    markdown?: boolean;
    lookupTag: LookupTag;
    conversationId: string;
    parentId: string | undefined;
    projectName: string;
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

    public addEntry(askBy: string, responseBy: string, model: string, ask: string, answer: string, lookup_tag: LookupTag, conversation_id: string, parent_id: string | undefined, project_name: string): string {
        const id = crypto.randomUUID();
        const entry: HistoryEntry = {
            id: id,
            ask_by: askBy,
            response_by: responseBy,
            timestamp: new Date().toISOString(),
            model: model,
            ask: ask,
            answer: answer,
            markdown: this.markDownResponse(answer),
            lookupTag: lookup_tag,
            conversationId: conversation_id,
            parentId: parent_id,
            projectName: project_name
        };
        this.history.push(entry);
        this.saveHistory();
        if(this.provider !== undefined) {
            this.provider.refresh();
        }
        output_log(`Asked By: ${askBy}, Response By: ${responseBy}, Model: ${model}, Project: ${project_name}`);
        return id;
    }

    public getHistory(): HistoryEntry[] {
        return this.history;
    }

    public findEntriesByConversationId(conversationId: string, tool_responses: boolean): HistoryEntry[] {
        if(tool_responses) {
            return this.history.filter(entry =>
                entry.conversationId === conversationId &&
                entry.lookupTag === LookupTag.TOOL_RESP
            );
        } 
        return this.history.filter(entry => 
            entry.conversationId === conversationId &&
            [LookupTag.PROJECT_RESP, LookupTag.MEMBER_RESP].includes(entry.lookupTag)
        );
    }

    public findEntryById(id: string): HistoryEntry[] {
        return this.history.filter(entry => 
            entry.id === id
        );
    }

    public findChildrenById(parentid: string): HistoryEntry[] {
        return this.history.filter(entry => 
            entry.parentId === parentid
        );
    }

    public getProjectByHistoryId(historyId: string): string | undefined {
        const entry = this.history.find(entry => entry.id === historyId);
        if (entry) {
            return entry.projectName;
        }
        return undefined;
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

    public getHistoryGroupedByDateForProject(projectName: string): Record<string, HistoryEntry[]> {
        const projectHistory = this.history.filter(entry => entry.projectName === projectName);
        return projectHistory.reduce((acc, entry) => {
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
                if (entry.parentId) {
                    const parent = conversationMap.get(entry.parentId);
                    const node = conversationMap.get(entry.id);
                    if (parent && node) {
                        parent.children.push(node);
                    }
                }
            });
    
            // Collect top-level conversations (those without a parent)
            const topLevelNodes = Array.from(conversationMap.values()).filter(node => !entries.some(e => e.id === node.id && e.parentId));
    
            // Create a date node and add the top-level conversation nodes as its children
            dateNodes.push({
                id: date,
                label: date,
                children: topLevelNodes
            });
        }
    
        return dateNodes;
    }

    public buildConversationThreads(parentId: string): { HumanMessage: string; AIMessage: string }[] {
        // Find children entries by parentId
        let children = this.findChildrenById(parentId);
        const entry = this.findEntryById(parentId);
        children = children.concat(entry);
    
        // Filter the entries based on the lookupTag
        const responses = children.filter(entry => 
            entry.lookupTag === 'ProjectResponse' || entry.lookupTag === 'MemberResponse'
        );
    
        // Separate ProjectResponse and MemberResponse
        const memberResponses = responses.filter(entry => entry.lookupTag === 'MemberResponse');
        const projectResponses = responses.filter(entry => entry.lookupTag === 'ProjectResponse');
    
        // Combine them into a conversation array with ProjectResponse last
        const conversation = [
            ...memberResponses.map(entry => ({
                HumanMessage: entry.ask,
                AIMessage: entry.answer,
            })),
            ...projectResponses.map(entry => ({
                HumanMessage: entry.ask,
                AIMessage: entry.answer,
            }))
        ];
    
        return conversation;
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



