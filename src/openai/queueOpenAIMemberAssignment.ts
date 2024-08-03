import OpenAI from 'openai';
import { fetchPrompts, personalizePrompt } from '../utils/prompts';
import { Setup, get_member_purposes_for_prompt } from '../utils/setup'; 
import { getcontent, save } from '../file/fileOperations';
import { HistoryManager } from '../utils/historyManager';

export async function queueOpenAIMemberAssignment(member_object: Setup, question: string, historyManager: HistoryManager, setups: Setup[]): Promise<string> {
    const openai = new OpenAI({ apiKey: member_object?.apiKey });
    let available_tools = [
        {
            type: 'function' as const,
            function: {
                name: 'getcontent',
                description: 'Return the content of the file at the path given',
                parameters: {
                    type: 'object',
                    properties: {
                        file: {
                            type: 'string',
                            description: 'the path to the file'
                        }
                    },
                    required: ['file'],
                },
            },
        },
        {
            type: 'function' as const,
            function: {
                name: 'save',
                description: 'Save the content to the file path given and open the file',
                parameters: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'the content to be saved'
                        },
                        file: {
                            type: 'string',
                            description: 'the path to the file'
                        }
                    },
                    required: ['content', 'file'],
                },
            },
        }
    ];

    const engineer_prompt_obj = fetchPrompts('system', member_object?.purpose ?? 'engineer', member_object?.model);
    let engineer_prompt = engineer_prompt_obj[0].content;
    if(engineer_prompt_obj[0].content.includes("${members")) {
        engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data", members: get_member_purposes_for_prompt(setups) });
    } else {
        engineer_prompt = personalizePrompt(engineer_prompt, { name: member_object?.name ?? "no-data" });
    }
    const messages = [{ role: 'system', content: engineer_prompt }, { role: 'user', content: question }];
    const startTime = Date.now();
    let response = {} as any;
    let toolCalls = [];

    do {
        const completion = await openai.chat.completions.create({
            messages: messages as any,
            model: member_object?.model ?? "no-model",
            tools: available_tools,
        });
        response = completion.choices[0].message;
        if((response.content ?? "no content").length > 0) {
            historyManager.addEntry('lead-architect', member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, response.content ?? "no content");
        }
        messages.push(response as any);
        toolCalls = response.tool_calls || [];
        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            let functionResponse = {} as any;
            if (functionName === 'getcontent') {
                functionResponse = getcontent(functionArgs.file);
            }
            if (functionName === 'save') {
                functionResponse = await save(functionArgs.content, functionArgs.file);
            }
            messages.push({
                role: 'tool',
                content: functionResponse,
                tool_call_id: toolCall.id,
            } as any);
            historyManager.addEntry(member_object?.name ?? "no-data", toolCall.function.name, member_object?.model ?? "no-model", `${toolCall.function.arguments.length} arguments`, functionResponse);
        }
    } while (toolCalls.length > 0 && (Date.now() - startTime) < 120000);

    messages.push({ role: 'user', content: 'explain your solution by describing each artifact you created or modified. Provide the path to each artifact touched. Explain steps to integrate into the larger solution.' });
    const final_completion = await openai.chat.completions.create({
        messages: messages as any,
        model: member_object?.model ?? "no-model",
    });
    response = final_completion.choices[0].message;
    if ((response.content ?? "").length > 0) {
        historyManager.addEntry('lead-architect', member_object?.name ?? "no-data", member_object?.model ?? "no-model", question, response.content ?? "");
    }
    return response.content ?? '';
}