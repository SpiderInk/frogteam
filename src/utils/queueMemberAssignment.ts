import { ExtensionContext } from 'vscode';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fetchSetupByName, Setup } from './setup';
import { HistoryManager } from './historyManager';
import { queueLangchainMemberAssignment } from '../langchain/queueLangchainMemberAssignment';
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import { fetchApiKey } from './common';
import { generateLangchainDalleImage } from "../langchain/LangchainDalleImage";
import { generateBedrockStabilityImage } from '../langchain/LangchainStabilityAICoreImage';
const PQueue = require('p-queue');

// types.ts
export interface QueueJob {
    type: 'member-assignment' | 'dalle-image' | 'stability-image';
    caller: string;
    payload: any;
    timestamp: number;
    tokenEstimate?: number;
}

export interface QueueMetrics {
    rpm: number;
    tpm: number;
    totalProcessed: number;
    avgProcessingTime: number;
}

// constants.ts
export const QUEUE_CONFIG = {
    MAX_QUEUE_SIZE: 100,
    PERSIST_THRESHOLD: 50,
    MAX_RPM: 60,
    MAX_TPM: 100000,
    QUEUE_FILE_PATH: 'queue-backup.json',
    METRICS_WINDOW_MS: 60000, // 1 minute
};

// queueMetrics.ts
export class QueueMetrics {
    private requests: number[] = [];
    private tokens: number[] = [];
    private windowMs: number;

    constructor(windowMs: number = QUEUE_CONFIG.METRICS_WINDOW_MS) {
        this.windowMs = windowMs;
    }

    addRequest(tokens: number = 0) {
        const now = Date.now();
        this.requests.push(now);
        this.tokens.push(tokens);
        this.cleanup(now);
    }

    private cleanup(now: number) {
        const threshold = now - this.windowMs;
        while (this.requests.length && this.requests[0] < threshold) {
            this.requests.shift();
            this.tokens.shift();
        }
    }

    getMetrics(): QueueMetrics {
        const now = Date.now();
        this.cleanup(now);
        let qm = new QueueMetrics();
        qm.rpm = this.requests.length;
        qm.tpm = this.tokens.reduce((sum, curr) => sum + curr, 0);
        qm.totalProcessed = this.requests.length;
        return qm;
    }

    canProcess(): boolean {
        const metrics = this.getMetrics();
        return metrics.rpm < QUEUE_CONFIG.MAX_RPM &&
            metrics.tpm < QUEUE_CONFIG.MAX_TPM;
    }
}


export class QueueManager {
    private queue: any;
    private metrics: QueueMetrics;
    private jobs: QueueJob[] = [];
    private context: ExtensionContext;

    constructor(context: ExtensionContext) {
        this.context = context;
        this.queue = new PQueue.default({ concurrency: 1 });
        this.metrics = new QueueMetrics();
        this.initialize();
    }

    private async initialize() {
        await this.loadPersistedQueue();
        this.queue.on('active', () => {
            if (this.jobs.length > QUEUE_CONFIG.PERSIST_THRESHOLD) {
                this.persistQueue();
            }
        });
    }

    private getQueueFilePath(): string {
        return join(this.context.globalStoragePath, QUEUE_CONFIG.QUEUE_FILE_PATH);
    }

    private async loadPersistedQueue() {
        try {
            const data = await fs.readFile(this.getQueueFilePath(), 'utf8');
            this.jobs = JSON.parse(data);
            for (const job of this.jobs) {
                await this.addToQueue(job);
            }
        } catch (error) {
            // File doesn't exist or is corrupt, start with empty queue
            this.jobs = [];
        }
    }

    private async persistQueue() {
        try {
            await fs.writeFile(
                this.getQueueFilePath(),
                JSON.stringify(this.jobs),
                'utf8'
            );
        } catch (error) {
            console.error('Failed to persist queue:', error);
        }
    }

    // In QueueManager class
    async addJob(job: QueueJob): Promise<string> {  // Changed return type from void to string
        if (this.jobs.length >= QUEUE_CONFIG.MAX_QUEUE_SIZE) {
            throw new Error('Queue is full');
        }

        this.jobs.push(job);
        return this.addToQueue(job);  // Now returning the result
    }

    private async addToQueue(job: QueueJob): Promise<string> {
        return this.queue.add(async () => {
            while (!this.metrics.canProcess()) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            try {
                const result = await this.processJob(job);
                this.metrics.addRequest(job.tokenEstimate);
                this.jobs = this.jobs.filter(j => j !== job);
                return result;  // This will be the string result from processJob
            } catch (error) {
                console.error('Job processing failed:', error);
                throw error;
            }
        });
    }

    private async processJob(job: QueueJob): Promise<string> {
        switch (job.type) {
            case 'member-assignment':
                return await this.processMemberAssignment(job);
            case 'dalle-image':
                return await this.processMemberAssignment(job);
            case 'stability-image':
                return await this.processMemberAssignment(job);
            default:
                throw new Error(`Unknown job type: ${job.type}`);
        }
    }

    // Implementation of specific job processors
    private async processMemberAssignment(job: QueueJob): Promise<string> {
        const { caller, payload } = job;
        const { member, question, historyManager, setups, conversationId, parentId, project } = payload;

        const member_object = fetchSetupByName(setups, member);
        switch (member_object?.model) {
            case 'dall-e-3':
                return await generateLangchainDalleImage(caller, member_object?.apiKey, member_object, question, historyManager, setups, conversationId, parentId, project);
            case 'stability.stable-image-core-v1:0':
                return await generateBedrockStabilityImage(caller, member_object?.aws_region, member_object, question, historyManager, setups, conversationId, parentId, project);
            case 'gpt-35-turbo':
            case 'gpt-4-turbo':
            case 'gpt-4o':
            case 'o1-preview':
            case 'o1-mini':
                if (member_object?.endpoint && member_object?.endpoint.length > 5) {
                    const azure_llm = new AzureChatOpenAI({
                        model: member_object?.model ?? "no-model",
                        azureOpenAIBasePath: `${member_object?.endpoint}/openai/deployments`,
                        azureOpenAIApiKey: member_object?.apiKey,
                        azureOpenAIApiVersion: "2024-06-01",
                        azureOpenAIApiDeploymentName: member_object?.az_deployment ?? "no-deployment",
                        maxRetries: 2,
                        maxTokens: 4096
                    });
                    return await queueLangchainMemberAssignment(caller, azure_llm, member_object, question, historyManager, setups, conversationId, parentId, project);
                } else {
                    const openai_llm = new ChatOpenAI({
                        apiKey: fetchApiKey(member_object?.apiKey),
                        model: member_object?.model ?? "no-model",
                        maxRetries: 0,
                        maxTokens: 4096
                    });
                    return await queueLangchainMemberAssignment(caller, openai_llm, member_object, question, historyManager, setups, conversationId, parentId, project);
                }
            case 'anthropic.claude-3-5-sonnet-20240620-v1:0':
            case 'anthropic.claude-3-5-haiku-20241022-v1:0':
                const bedrock_llm = new BedrockChat({
                    region: member_object?.aws_region,
                    model: member_object?.model ?? "no-model",
                    maxRetries: 0,
                    maxTokens: 8000
                });
                return await queueLangchainMemberAssignment(caller, bedrock_llm, member_object, question, historyManager, setups, conversationId, parentId, project);
            default:
                return 'no model';
        }
    }

    // Implement other job processors...

    getMetrics(): QueueMetrics {
        return this.metrics.getMetrics();
    }

    async shutdown(): Promise<void> {
        await this.queue.onIdle();
        await this.persistQueue();
    }
}

export class ServiceContainer {
    private static instance: ServiceContainer;
    private services: Map<string, any> = new Map();

    public static initialize(context: ExtensionContext): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
            ServiceContainer.instance.services.set('queueManager', new QueueManager(context));
        }
        return ServiceContainer.instance;
    }

    public static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            throw new Error('ServiceContainer not initialized');
        }
        return ServiceContainer.instance;
    }

    public getQueueManager(): QueueManager {
        return this.services.get('queueManager');
    }
}

// Refactored queueMemberAssignment.ts
export async function queueMemberAssignment(
    caller: string,
    member: string,
    question: string,
    setups: any,
    historyManager: HistoryManager,
    conversationId: string,
    parentId: string | undefined,
    project: string
): Promise<string> {
    const queueManager = ServiceContainer.getInstance().getQueueManager();

    const job: QueueJob = {
        type: 'member-assignment',
        caller,
        payload: {
            member,
            question,
            setups,
            historyManager,
            conversationId,
            parentId,
            project
        },
        timestamp: Date.now(),
        tokenEstimate: 1000 // Implement proper estimation
    };

    return await queueManager.addJob(job);
}
