import * as vscode from 'vscode';
import { fetchPrompts, personalizePrompt } from '../utils/prompts';
import { Setup, get_member_purposes_for_prompt } from '../utils/setup';
import { HistoryManager, LookupTag } from '../utils/historyManager';
import { HumanMessage, ToolMessage, AIMessageChunk, AIMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ToolCall } from "@langchain/core/messages/tool";
import { getFileContentApiTool, saveContentToFileApiTool, fetchHistoryApiTool } from '../utils/langchain-tools';
import { output_log } from '../utils/outputChannelManager';
import { generateShortUniqueId } from '../utils/common'

export async function queueLangchainMemberAssignment(caller: string, llm: BaseChatModel, member_object: Setup, question: string, historyManager: HistoryManager, setups: Setup[], conversationId: string, parentId: string | undefined, project: string): Promise<string> {
    let response = {} as any;
    const engineer_prompt_obj = fetchPrompts('system', member_object?.purpose ?? 'engineer', member_object?.model);
    const task_summary_prompt = fetchPrompts('system', 'task-summary', member_object?.model);
    let run = true;
    if(engineer_prompt_obj[0] === undefined) {
        const msg = `There is no ${member_object?.purpose ?? 'engineer'} prompt aligned with ${member_object?.model}. Skipping task.`;
        vscode.window.showInformationMessage(msg);
        output_log(msg);
        run = false;
    }
    if (run && llm.bindTools) {
        // ** if I change this function so that I inject llm then I can call this queueLangchainMemberAssignment **
        const llmWithTools = llm.bindTools([
            getFileContentApiTool,
            saveContentToFileApiTool
        ]);

        let engineer_prompt = engineer_prompt_obj[0].content;
        if (engineer_prompt_obj[0].content.includes("${members")) {
            engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data", members: get_member_purposes_for_prompt(setups) });
        } else {
            engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data" });
        }

        let toolMapping: { [key: string]: any } = {
            "getFileContentApi": getFileContentApiTool,
            "saveContentToFileApi": saveContentToFileApiTool
        };

        // ** parent_id should only be used here when this was a direct from user task **
        let messages: (SystemMessage | HumanMessage | ToolMessage | AIMessage)[] = [];
        messages.push(new SystemMessage(engineer_prompt));
        if(parentId !== undefined && caller === 'user') {
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
        let toolCalls = [];
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
        const parent_id = historyManager.addEntry(caller, member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, answer_for_history, LookupTag.MEMBER_TASK, conversationId, parentId, project);
        do {
            messages.push(llmOutput as AIMessage);
            if (llmOutput.tool_calls && llmOutput.tool_calls.length > 0) {
                for (const toolCall of llmOutput.tool_calls) {
                    let toolOutput;
                    try {
                        let tool = toolMapping[toolCall.name];
                        toolOutput = await tool.invoke(toolCall.args);
                        let newTM = new ToolMessage({
                            tool_call_id: toolCall.id!,
                            content: toolOutput
                        });
                        messages.push(newTM);
                    } catch {
                        toolOutput = "tool failed";
                        output_log(`${member_object?.name ?? "unknown"}: Tool call ${toolCall.name} failed`);
                    }
                    historyManager.addEntry(member_object?.name ?? "no-data", `tool:${toolCall.name}`, member_object?.model ?? "no-model", `args: ${JSON.stringify(toolCall.args)}`, toolOutput, LookupTag.TOOL_RESP, conversationId, parent_id, project);
                }
                llmOutput = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
            }
        } while (llmOutput.tool_calls && llmOutput.tool_calls.length > 0 && (Date.now() - startTime) < 120000);
        // we are using the "user" message space
        messages.push(new HumanMessage(task_summary_prompt[0].content));
        const final_completion = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
        response = final_completion.content.toString();
        historyManager.addEntry(caller, member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, (response.length > 0 ? response : "no final response"), LookupTag.MEMBER_RESP, conversationId, parent_id, project); //what parent id to use here?

    } else if(!llm.bindTools) {
        const msg = 'LLM does not support tools';
        vscode.window.showInformationMessage(msg);
        output_log(msg);
    }
    return response;
};