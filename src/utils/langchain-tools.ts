import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { save, getcontent } from "../file/fileOperations";

const getFileContentApiSchema = z.object({
    fileName: z.string().describe("The path of the file to read")
});

export const getFileContentApiTool = tool(
    async ({ fileName }: { fileName: string }) => {
        console.log("Reading file: ", fileName);
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
        console.log("Saving content to file: ", fileName);
        save(content, fileName);
        return `Content written to ${fileName}`;
    },
    {
        name: "saveContentToFileApi",
        description: "Save the given content to a specified file.",
        schema: saveContentToFileApiSchema,
    }
);