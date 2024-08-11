import OpenAI from 'openai';
import { fetchPrompts, personalizePrompt } from '../utils/prompts';
import { Setup, fetchSetupByPurpose, get_member_purposes_for_prompt } from '../utils/setup';
import { queueMemberAssignment } from '../utils/queueMemberAssignment';
import { HistoryManager } from '../utils/historyManager';

// ** we have moved to langchain this is not used

/*
- The is the main function that handles the projectGo functionality.
- It fetches the member object based on the 'lead-architect' purpose from the setups array.
- It fetches the system prompt, personalizes it with the member's purposes, and sends the question to the OpenAI API.
- If a tool is required, it calls the corresponding function to handle the tool call.
- The function returns the response from the OpenAI API.
- It also manages the history of the conversation using the HistoryManager class.
- The function is called from the main server.ts file.
*/

const tools = [
    {
        type: "function" as const,
        function: {
            name: "queue_member_assignment",
            description: "Send technical instructions for a software project where file system artifacts will be produced in a Visual Studio Code environment.",
            parameters: {
                type: "object",
                properties: {
                    member: {
                        type: "string",
                        description: "The name of the team member to assign the task to.",
                    },
                    instructions: {
                        type: "string",
                        description: "The step by step instructions for the assignment.",
                    }
                },
                required: ["instructions"],
            },
        },
    }
];

export async function projectGo(question: string, setups: Setup[], historyManager: HistoryManager): Promise<string> {
    const member_object = fetchSetupByPurpose(setups, 'lead-architect');
    const openai = new OpenAI({ apiKey: member_object?.apiKey });
    let tool_functions = {
        queue_member_assignment: queueMemberAssignment,
    } as any;

    const system_prompt_obj = fetchPrompts('system', 'lead-architect', 'gpt-4o');
    const prompt = personalizePrompt(system_prompt_obj[0].content, { members: get_member_purposes_for_prompt(setups) });
    const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: question },
    ];

    const response = await openai.chat.completions.create({
        model: system_prompt_obj[0].models,
        messages: messages as any,
        tools: tools,
    });
    
    let result = response.choices[0].message ?? {};
    historyManager.addEntry('user', system_prompt_obj[0].role, system_prompt_obj[0].models, question, result.content ?? "no content.");
    
    messages.push(result as any);
    
    const toolCalls = result.tool_calls as any;
    for (const toolCall of toolCalls) {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const functionResponse = await queueMemberAssignment(
            functionArgs.member,
            functionArgs.instructions,
            setups,
            historyManager
        );
        messages.push({
            content: functionResponse,
            role: 'tool',
            tool_call_id: toolCall.id,
        } as any);
        historyManager.addEntry(functionArgs.member, toolCall.function.name.substring(0,12), system_prompt_obj[0].models, `${toolCall.function.arguments.length} arguments`, functionResponse);
    }
    
    const secondResponse = await openai.chat.completions.create({
        model: system_prompt_obj[0].models,
        messages: messages as any,
    });
    
    if (secondResponse.choices[0].message.content) {
        const result = secondResponse.choices[0].message.content ?? '';
        historyManager.addEntry('user', system_prompt_obj[0].role, system_prompt_obj[0].models, question, result);
    }
    const final_response = secondResponse.choices[0].message.content ?? '';
    return final_response;
}