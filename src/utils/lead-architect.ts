import * as vscode from 'vscode';
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ChatOpenAI } from "@langchain/openai";
import { fetchPrompts, personalizePrompt } from './prompts';
import { Setup, fetchSetupByPurpose, get_member_purposes_for_prompt } from './setup';
import { HistoryManager } from './historyManager';
import { HumanMessage, ToolMessage, AIMessageChunk, AIMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getQueueMemberAssignmentApiTool } from "./langchain-tools";
import { queueMemberAssignment } from "./queueMemberAssignment";
import { ToolCall } from "@langchain/core/messages/tool";
import { output_log } from './outputChannelManager';

export async function projectGo(question: string, setups: Setup[], historyManager: HistoryManager): Promise<string> {
    const member_object = fetchSetupByPurpose(setups, 'lead-architect');

    switch(member_object?.model) {
        case 'gpt-3.5-turbo':
        case 'gpt-4-turbo':
        case 'gpt-4o':
            const openai_llm = new ChatOpenAI({
                apiKey: member_object?.apiKey,
                model: member_object?.model ?? "no-model",
                maxRetries: 0,
            });
            return await leadArchitectGo(openai_llm, question, setups, historyManager, member_object?.model, member_object?.name);
        case 'meta.llama3-8b-instruct-v1:0':
        case 'meta.llama3-70b-instruct-v1:0':
        case 'anthropic.claude-3-5-sonnet-20240620-v1:0':
        case 'anthropic.claude-3-haiku-20240307-v1:0':
            const bedrock_llm = new BedrockChat({
                region: member_object?.aws_region ?? "us-east-1",
                model: member_object?.model ?? "no-model",
                maxRetries: 0,
            });
            return await leadArchitectGo(bedrock_llm, question, setups, historyManager, member_object?.model, member_object?.name);
        default:
            return 'no model';
    }
}

export async function leadArchitectGo(llm: BaseChatModel, question: string, setups: Setup[], historyManager: HistoryManager, model: string, member_name: string): Promise<string> {
    let response = {} as any;
    const system_prompt_obj = fetchPrompts('system', 'lead-architect', model);
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
        const prompt = personalizePrompt(system_prompt_obj[0].content, { members: get_member_purposes_for_prompt(setups) });
        let messages: (SystemMessage | HumanMessage | ToolMessage | AIMessage)[] = [
            new SystemMessage(prompt),
            new HumanMessage(question)
        ];

        const startTime = Date.now();
        let llmOutput = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
        do {

            messages.push(llmOutput as AIMessage);
            if (llmOutput.content.toString().length > 0) {
                historyManager.addEntry('user', member_name, model, question, llmOutput.content.toString());
            }

            if (llmOutput.tool_calls && llmOutput.tool_calls.length > 0) {
                for (const toolCall of llmOutput.tool_calls) {
                    if(toolCall.name === "getQueueMemberAssignmentApi") {
                        // Setups and HistoryManager are too complex for
                        let toolOutput = await queueMemberAssignment(toolCall.args.member, toolCall.args.question, setups, historyManager);
                        let newTM = new ToolMessage({
                            tool_call_id: toolCall.id!,
                            content: toolOutput
                        });
                        messages.push(newTM);
                        historyManager.addEntry(member_name, toolCall.name, model, `args: ${toolCall.args}`, toolOutput);
                    } else {
                        throw new Error(`Unknown tool: ${toolCall.name}`);
                    }
                }
                llmOutput = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
            }
        } while (llmOutput.tool_calls && llmOutput.tool_calls.length > 0 && (Date.now() - startTime) < 120000);

        messages.push(new HumanMessage("explain your solution by describing each artifact you created or modified. Provide the path to each artifact touched. Explain steps to integrate into the larger solution."));
        const final_completion = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
        response = final_completion.content.toString();
        if (response.length > 0) {
            historyManager.addEntry("user", member_name, model, question, response);
        }
    } else if(!llm.bindTools) {
        const msg = 'LLM does not support tools';
        vscode.window.showInformationMessage(msg);
        output_log(msg);
    }
    return response;
}