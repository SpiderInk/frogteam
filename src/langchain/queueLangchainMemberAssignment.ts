import * as vscode from 'vscode';
import { fetchPrompts, personalizePrompt } from '../utils/prompts';
import { Setup, get_member_purposes_for_prompt } from '../utils/setup';
import { HistoryManager, LookupTag } from '../utils/historyManager';
import { HumanMessage, ToolMessage, AIMessageChunk, AIMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ToolCall } from "@langchain/core/messages/tool";
import { getFileContentApiTool, saveContentToFileApiTool, codeSearchApiTool } from '../utils/langchain-tools';
import { output_log } from '../utils/outputChannelManager';
import { PromptExperiment } from '../mlflow/promptExperiment';
import { getMlflowServerAddress } from '../utils/config';

export async function queueLangchainMemberAssignment(caller: string, llm: BaseChatModel, member_object: Setup, question: string, historyManager: HistoryManager, setups: Setup[], conversationId: string, parentId: string | undefined, project: string): Promise<string> {
    // **1**
    let duration = 0;
    const promptExperiment = new PromptExperiment(getMlflowServerAddress());
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
            saveContentToFileApiTool,
            codeSearchApiTool
        ]);

        let engineer_prompt = engineer_prompt_obj[0].content;
        if (engineer_prompt_obj[0].content.includes("${members")) {
            engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data", members: get_member_purposes_for_prompt(setups) });
        } else {
            engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data" });
        }

        let toolMapping: { [key: string]: any } = {
            "getFileContentApi": getFileContentApiTool,
            "saveContentToFileApi": saveContentToFileApiTool,
            "codeSearchApiTool": codeSearchApiTool
        };

        // ** parent_id should only be used here when this was a direct from user task **
        let messages: (SystemMessage | HumanMessage | ToolMessage | AIMessage)[] = [];
        messages.push(new SystemMessage(engineer_prompt));
        // if(parentId !== undefined && caller === 'user') {
        if(parentId !== undefined) {
            // Build the conversation threads
            const conversationThreads = historyManager.buildConversationThreads(parentId);
            // Map the conversation threads to the appropriate message types and add them to the messages array
            conversationThreads.forEach(thread => {
                messages.push(new HumanMessage(thread.HumanMessage));
                messages.push(new AIMessage(thread.AIMessage));
                messages.push(new HumanMessage("Continue the development of the task we are working on."));
            });
        }
        // Now add the final prompt and question to the end of the messages array
        messages.push(new HumanMessage(question));
        // let passes = 2;
        let parent_id = "";
        try {
            // start the the mlflow run for the main prompt's conversation cycle
            const engineer_prompt_experiment_id = await promptExperiment.startRunAndLogPrompt(engineer_prompt_obj[0]);
            const startTime = Date.now();
            // do {
            //    passes = passes  - 1;
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
                parent_id = historyManager.addEntry(caller, member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, answer_for_history, LookupTag.MEMBER_TASK, conversationId, parentId, project);
                let calls = 0;
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
                        // if (llmOutput.content.toString().length > 0) {
                        //     messages.push(new AIMessage(llmOutput.content.toString()));
                        //     messages.push(new HumanMessage("Continue polishing the solution with another pass on the current conversation."));
                        // }
                        calls = 0;
                        if (llmOutput.tool_calls && llmOutput.tool_calls.length > 0) {
                            calls = llmOutput.tool_calls.length;
                        }
                    }
                } while (calls > 0);
                // the second pass may result in error if the last response had no content...
            // } while( passes > 0 && (Date.now() - startTime) < 180000); // but after 3 minutes we need to stop

            const endTime = Date.now();
            duration = endTime - startTime;
            await promptExperiment.endRunAndLogPromptResult(engineer_prompt_experiment_id, JSON.stringify(messages), duration, question);
            // we are using the "user" message space
            messages.push(new HumanMessage(task_summary_prompt[0].content));
            const task_summary_prompt_experiment_id = await promptExperiment.startRunAndLogPrompt(task_summary_prompt[0]);
            const summary_StartTime = Date.now();
            const final_completion = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
            const summary_EndTime = Date.now();
            duration = summary_EndTime - summary_StartTime;
            response = final_completion.content.toString();
            await promptExperiment.endRunAndLogPromptResult(task_summary_prompt_experiment_id, response, duration, question);
            historyManager.addEntry(caller, member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, (response.length > 0 ? response : "no final response"), LookupTag.MEMBER_RESP, conversationId, parent_id, project); //what parent id to use here?
        } catch (error) {
            vscode.window.showErrorMessage(`queueLangchainMemberAssignment Error: ${error}\n\nTry submitting again.`);
            output_log(`queueLangchainMemberAssignment Error: ${error}`);
            historyManager.addEntry(caller, member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, `Queue Member Assignment Error: ${error}`, LookupTag.PROJECT_RESP, conversationId, undefined, project);
        }
    } else if(!llm.bindTools) {
        const msg = 'queueLangchainMemberAssignment: LLM does not support tools';
        vscode.window.showInformationMessage(msg);
        output_log(msg);
    }
    return response;
};