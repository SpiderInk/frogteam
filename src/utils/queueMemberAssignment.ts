import { fetchSetupByName, Setup } from './setup'; 
import { HistoryManager } from './historyManager';
import { queueLangchainMemberAssignment } from '../langchain/queueLangchainMemberAssignment';
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import { fetchApiKey } from './common';

export async function queueMemberAssignment(caller: string, member: string, question: string, setups: any, historyManager: HistoryManager, conversationId: string, parentId: string | undefined, project:string): Promise<string> {

    const member_object = fetchSetupByName(setups, member);
    switch(member_object?.model) {
        case 'gpt-35-turbo':
        case 'gpt-4-turbo':
        case 'gpt-4o':
            if(member_object?.endpoint && member_object?.endpoint.length > 5) {
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
        case 'anthropic.claude-3-haiku-20240307-v1:0':
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
