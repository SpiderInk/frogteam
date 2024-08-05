import { fetchPrompts, personalizePrompt } from '../utils/prompts';
import { Setup, get_member_purposes_for_prompt } from '../utils/setup';
import { HistoryManager } from '../utils/historyManager';
import { HumanMessage, ToolMessage, AIMessageChunk, AIMessage, SystemMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
// import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { ToolCall } from "@langchain/core/messages/tool";
import { getFileContentApiTool, saveContentToFileApiTool } from '../utils/langchain-tools';

export async function queueLangchainMemberAssignment(llm: BaseChatModel, member_object: Setup, question: string, historyManager: HistoryManager, setups: Setup[]): Promise<string> {
    if (llm.bindTools) {
        // ** if I change this function so that I inject llm then I can call this queueLangchainMemberAssignment **
        const llmWithTools = llm.bindTools([
            getFileContentApiTool,
            saveContentToFileApiTool
        ]);
        const engineer_prompt_obj = fetchPrompts('system', member_object?.purpose ?? 'engineer', member_object?.model);

        let engineer_prompt = engineer_prompt_obj[0].content;
        if (engineer_prompt_obj[0].content.includes("${members")) {
            engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data", members: get_member_purposes_for_prompt(setups) });
        } else {
            engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data" });
        }
        // const engineer_prompt = personalizePrompt(engineer_prompt_obj[0].content, { name: member_object?.name ?? "no-data" });

        let toolMapping: { [key: string]: any } = {
            "getFileContentApi": getFileContentApiTool,
            "saveContentToFileApi": saveContentToFileApiTool
        };

        let messages: (SystemMessage | HumanMessage | ToolMessage | AIMessage)[] = [
            new SystemMessage(engineer_prompt),
            new HumanMessage(question)
        ];

        const startTime = Date.now();
        let response = {} as any;
        let toolCalls = [];
        let llmOutput = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
        do {

            messages.push(llmOutput as AIMessage);
            if (llmOutput.content.toString().length > 0) {
                historyManager.addEntry('lead-architect', member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, llmOutput.content.toString());
            }

            if (llmOutput.tool_calls && llmOutput.tool_calls.length > 0) {
                for (const toolCall of llmOutput.tool_calls) {
                    let tool = toolMapping[toolCall.name];
                    let toolOutput = await tool.invoke(toolCall.args);
                    let newTM = new ToolMessage({
                        tool_call_id: toolCall.id!,
                        content: toolOutput
                    });
                    messages.push(newTM);
                    historyManager.addEntry(member_object?.name ?? "no-data", toolCall.name, member_object?.model ?? "no-model", `${toolCall.args.length} arguments`, toolOutput);
                }
                llmOutput = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
            }
        } while (llmOutput.tool_calls && llmOutput.tool_calls.length > 0 && (Date.now() - startTime) < 120000);

        messages.push(new HumanMessage("explain your solution by describing each artifact you created or modified. Provide the path to each artifact touched. Explain steps to integrate into the larger solution."));
        const final_completion = await llmWithTools.invoke(messages) as AIMessageChunk & { tool_calls?: ToolCall[] };
        response = final_completion.content.toString();
        if (response.length > 0) {
            historyManager.addEntry('lead-architect', member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, response);
        }
        return response;
    } else {
        throw new Error('LLM does not support tools');
    }
};