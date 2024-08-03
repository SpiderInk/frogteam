import { fetchSetupByName, Setup } from './setup'; 
import { HistoryManager } from './historyManager';
import { queueOpenAIMemberAssignment } from '../openai/queueOpenAIMemberAssignment';
import { queueBedrockMemberAssignment } from '../bedrock/queueBedrockMemberAssignment';

export async function queueMemberAssignment(member: string, question: string, setups: any, historyManager: HistoryManager): Promise<string> {
    const member_object = fetchSetupByName(setups, member);

    switch(member_object?.model) {
        case 'gpt-3.5-turbo':
        case 'gpt-4-turbo':
        case 'gpt-4o':
            return await queueOpenAIMemberAssignment(member_object, question, historyManager, setups);
        case 'meta.llama3-8b-instruct-v1:0':
        case 'meta.llama3-70b-instruct-v1:0':
        case 'anthropic.claude-3-5-sonnet-20240620-v1:0':
        case 'anthropic.claude-3-haiku-20240307-v1:0':
            return await queueBedrockMemberAssignment(member_object, question, historyManager, setups);
        default:
            return 'no model';
    }

}
