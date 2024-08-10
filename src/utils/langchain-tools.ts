import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { save, getcontent } from "../file/fileOperations";
import { output_log } from './outputChannelManager';

const getFileContentApiSchema = z.object({
    fileName: z.string().describe("The path of the file to read")
});

export const getFileContentApiTool = tool(
    async ({ fileName }: { fileName: string }) => {
        output_log(`Reading file: ${fileName}`);
        return await getcontent(fileName);
    },
    {
        name: "getFileContentApi",
        description: "Read the content of a specified file.",
        schema: getFileContentApiSchema,
    }
);

const saveContentToFileApiSchema = z.object({
    content: z.string().describe("The content to write to the file"),
    fileName: z.string().describe("The path of the file to write")
});

export const saveContentToFileApiTool = tool(
    async ({ content, fileName }: { content: string; fileName: string }) => {
        output_log(`Saving content to file: ${fileName}`);
        save(content, fileName);
        return `Content written to ${fileName}`;
    },
    {
        name: "saveContentToFileApi",
        description: "Save the given content to a specified file.",
        schema: saveContentToFileApiSchema,
    }
);

// Define the schema for the tool
const getQueueMemberAssignmentApiSchema = z.object({
    member: z.string().describe("The member to assign to"),
    question: z.string().describe("The user's project description")
});

function queueMemberAssignment(member: string, question: string){
    // **mock** never used
    // the real queueMemberAssignment takes some complex objects that
    // the llm can't output in text so when this tool is used I call the real
    // version and pass the additional parameters needed.
}

// Define the tool function
export const getQueueMemberAssignmentApiTool = tool(
    async ({ member, question }: z.infer<typeof getQueueMemberAssignmentApiSchema>) => {
        output_log(`Assigning queue member: ${member}`);
        return await queueMemberAssignment(member, question);
    },
    {
        name: "getQueueMemberAssignmentApi",
        description: "Assign a queue member to a user based on the project description.",
        schema: getQueueMemberAssignmentApiSchema,
    }
);
