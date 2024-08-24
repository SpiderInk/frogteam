import * as vscode from 'vscode';
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import { fetchPrompts, personalizePrompt } from './prompts';
import { Setup, fetchSetupByPurpose, get_member_purposes_for_prompt } from './setup';
import { HistoryManager, LookupTag } from './historyManager';
import { HumanMessage, ToolMessage, AIMessageChunk, AIMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getQueueMemberAssignmentApiTool, fetchHistoryApiTool } from "./langchain-tools";
import { queueMemberAssignment } from "./queueMemberAssignment";
import { ToolCall } from "@langchain/core/messages/tool";
import { output_log } from './outputChannelManager';
import { fetchApiKey } from '../utils/common';

export async function projectGo(question: string, setups: Setup[], historyManager: HistoryManager, conversationId: string, parentId: string | undefined): Promise<string> {
    const member_object = fetchSetupByPurpose(setups, 'lead-architect');

    switch(member_object?.model) {
        case 'gpt-3.5-turbo':
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
                return await leadArchitectGo(azure_llm, question, setups, historyManager, member_object?.model, member_object?.name, conversationId, parentId);
            } else {
                const openai_llm = new ChatOpenAI({
                    apiKey: fetchApiKey(member_object?.apiKey),
                    model: member_object?.model ?? "no-model",
                    maxRetries: 0,
                });
                return await leadArchitectGo(openai_llm, question, setups, historyManager, member_object?.model, member_object?.name, conversationId, parentId);
            }
        case 'anthropic.claude-3-5-sonnet-20240620-v1:0':
        case 'anthropic.claude-3-haiku-20240307-v1:0':
            const bedrock_llm = new BedrockChat({
                region: member_object?.aws_region ?? "us-east-1",
                model: member_object?.model ?? "no-model",
                maxRetries: 0,
            });
            return await leadArchitectGo(bedrock_llm, question, setups, historyManager, member_object?.model, member_object?.name, conversationId, parentId);
        default:
            return 'no model';
    }
}

export async function leadArchitectGo(llm: BaseChatModel, question: string, setups: Setup[], historyManager: HistoryManager, model: string, member_name: string, conversationId: string, parentId: string | undefined): Promise<string> {

    /*
        - lookup who the lead architect is
        - throw error if there is no lead architect or if there is more than one
        - historyManager needs to record the member name and role for every entry
    */



    let response = {} as any;
    const system_prompt_obj = fetchPrompts('system', 'lead-architect', model);
    const task_summary_prompt = fetchPrompts('system', 'task-summary', model);
    let run = true;
    if(system_prompt_obj[0] === undefined) {
        const msg = `There is no lead-architect prompt aligned with ${model}. Skipping Action.`;
        vscode.window.showInformationMessage(msg);
        output_log(msg);
        run = false;
    }
    if (run && llm.bindTools) {
        const llmWithTools = llm.bindTools([
            getQueueMemberAssignmentApiTool
        ]);
        let toolMapping: { [key: string]: any } = {
            "getQueueMemberAssignmentApi": queueMemberAssignment
        };
        const prompt = personalizePrompt(system_prompt_obj[0].content, { members: get_member_purposes_for_prompt(setups) });

        // using parentId
        // fetch from history the original user question and the lead engineers summary response
        //  - add these as the first HumanMessage and the first AIMessage
        let messages: (SystemMessage | HumanMessage | ToolMessage | AIMessage)[] = [];
        messages.push(new SystemMessage(prompt));
        if(parentId !== undefined) {
            // Build the conversation threads
            const conversationThreads = historyManager.buildConversationThreads(parentId);
            // Map the conversation threads to the appropriate message types and add them to the messages array
            conversationThreads.forEach(thread => {
                messages.push(new HumanMessage(thread.HumanMessage));
                messages.push(new AIMessage(thread.AIMessage));
            });
        }
        // Now add the final prompt and question to the end of the messages array
        messages.push(new HumanMessage(question));

        const startTime = Date.now();
        let llmOutput = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
        let answer_for_history = "";
        if (llmOutput.content.toString().length > 0) {
            answer_for_history = llmOutput.content.toString();
        } else {
            answer_for_history = "no answer";
            if (llmOutput.tool_calls && llmOutput.tool_calls.length > 0) {
                answer_for_history = "tool calls pending.";
            }
        }
        const parent_id = historyManager.addEntry('user', member_name, model, question, answer_for_history, LookupTag.PROJECT_DESC, conversationId, undefined);
        do {
            messages.push(llmOutput as AIMessage);
            if (llmOutput.tool_calls && llmOutput.tool_calls.length > 0) {
                for (const toolCall of llmOutput.tool_calls) {
                    if(toolCall.name === "getQueueMemberAssignmentApi") {
                        // Setups and HistoryManager are too complex so we have to inject them more directly
                        let toolOutput = await queueMemberAssignment('lead-architect', toolCall.args.member, toolCall.args.question, setups, historyManager, conversationId, parent_id);
                        let newTM = new ToolMessage({
                            tool_call_id: toolCall.id!,
                            content: toolOutput
                        });
                        messages.push(newTM);
                        historyManager.addEntry(member_name, `tool:${toolCall.name}`, model, `args: ${JSON.stringify(toolCall.args)}`, toolOutput, LookupTag.TOOL_RESP, conversationId, parent_id);
                    } else {
                        let tool = toolMapping[toolCall.name];
                        let toolOutput = await tool.invoke(toolCall.args);
                        let newTM = new ToolMessage({
                            tool_call_id: toolCall.id!,
                            content: toolOutput
                        });
                        messages.push(newTM);
                        historyManager.addEntry(member_name, `tool:${toolCall.name}`, model, `args: ${JSON.stringify(toolCall.args)}`, toolOutput, LookupTag.TOOL_RESP, conversationId, parent_id);
                    }
                }
                llmOutput = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
            }
        } while (llmOutput.tool_calls && llmOutput.tool_calls.length > 0 && (Date.now() - startTime) < 120000);
        messages.push(new HumanMessage(task_summary_prompt[0].content));
        const final_completion = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
        response = final_completion.content.toString();
        historyManager.addEntry("user", member_name, model, question, (response.length > 0 ? response : "no final response"), LookupTag.PROJECT_RESP, conversationId, parent_id);
    } else if(!llm.bindTools) {
        const msg = 'LLM does not support tools';
        vscode.window.showInformationMessage(msg);
        output_log(msg);
    }
    return response;
}