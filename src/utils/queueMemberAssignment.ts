import { fetchSetupByName, Setup } from './setup'; 
import { HistoryManager } from './historyManager';
import { queueLangchainMemberAssignment } from '../langchain/queueLangchainMemberAssignment';
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ChatOpenAI } from "@langchain/openai";
import { fetchApiKey } from './common';

export async function queueMemberAssignment(member: string, question: string, setups: any, historyManager: HistoryManager): Promise<string> {

    const member_object = fetchSetupByName(setups, member);
    switch(member_object?.model) {
        case 'gpt-35-turbo':
        case 'gpt-4-turbo':
        case 'gpt-4o':
            const openai_llm = new ChatOpenAI({
                apiKey: fetchApiKey(member_object?.apiKey),
                model: member_object?.model ?? "no-model",
                maxRetries: 0,
                maxTokens: 4096
            });
            return await queueLangchainMemberAssignment(openai_llm, member_object, question, historyManager, setups);

            // this is the openai client way
            // return await queueOpenAIMemberAssignment(member_object, question, historyManager, setups);
        case 'meta.llama3-8b-instruct-v1:0':
        case 'meta.llama3-70b-instruct-v1:0':
        case 'anthropic.claude-3-5-sonnet-20240620-v1:0':
        case 'anthropic.claude-3-haiku-20240307-v1:0':
            const bedrock_llm = new BedrockChat({
                region: member_object?.aws_region,
                model: member_object?.model ?? "no-model",
                maxRetries: 0,
                maxTokens: 8000
            });
            return await queueLangchainMemberAssignment(bedrock_llm, member_object, question, historyManager, setups);
            // return await queueBedrockMemberAssignment(member_object, question, historyManager, setups);)
        default:
            return 'no model';
    }

}
