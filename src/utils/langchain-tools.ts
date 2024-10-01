import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { save, getcontent } from "../file/fileOperations";
import { output_log } from './outputChannelManager';
import { FetchHistory } from './historyManager';
import { searchFiles } from '../utils/search';

const codeSearchApiSchema = z.object({
    searchTerm: z.string().describe("The term to search for within the files."),
    filePattern: z.string().describe("The file pattern to match (default is '*' for all files).")
});

export const codeSearchApiTool = tool(
    async ({ searchTerm, filePattern }: { searchTerm: string, filePattern: string }) => {
        output_log(`Searching for: ${searchTerm} with pattern: ${filePattern}`);
        return await searchFiles(searchTerm, filePattern || '*');
    },
    {
        name: "codeSearchApiTool",
        description: "Searches for files matching the given pattern and containing the specified search term.",
        schema: codeSearchApiSchema,
    }
);

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
        description: "Save the given content to a specified file. <always>provide the complete content of the file even if you are making an edit.</always>",
        schema: saveContentToFileApiSchema,
    }
);

// Define the schema for the tool
const getQueueMemberAssignmentApiSchema = z.object({
    caller: z.string().describe("The caller responsible for the user prompt"),
    member: z.string().describe("The member to assign to"),
    question: z.string().describe("The user's project description")
});

function queueMemberAssignment(caller: string, member: string, question: string){
    // **mock** never used
    // the real queueMemberAssignment takes some complex objects that
    // the llm can't output in text so when this tool is used I call the real
    // version and pass the additional parameters needed.
}

// Define the tool function
export const getQueueMemberAssignmentApiTool = tool(
    async ({ caller, member, question }: z.infer<typeof getQueueMemberAssignmentApiSchema>) => {
        output_log(`Assigning queue member: ${member}`);
        return await queueMemberAssignment(caller, member, question);
    },
    {
        name: "getQueueMemberAssignmentApi",
        description: "Assign a queue member to a user based on the project description.",
        schema: getQueueMemberAssignmentApiSchema,
    }
);

// Define the schema for the tool
const fetchHistoryApiSchema = z.object({
    directory: z.string().describe("(optional) The project directory associated with the inquiry.")
});

export const fetchHistoryApiTool = tool(
    async ({ directory }: { directory: string }) => {
        output_log(`Fetching historic responses for project directory ${directory}`);
        return await FetchHistory(directory);
    },
    {
        name: "fetchHistoryApi",
        description: "Search for the original assignment and other interactions to gain better context about the project and question.",
        schema: fetchHistoryApiSchema,
    }
);