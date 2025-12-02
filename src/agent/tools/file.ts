import { tool } from "ai";
import { z } from "zod";

/**
 * Read file contents
 */
export const readFile = tool({
  description:
    "Read the contents of a file at the specified path. Use this to examine file contents.",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to read"),
  }),
  execute: async ({ path }: { path: string }) => {
    // Stub implementation - will be replaced with real fs operations
    return `[Stub] Contents of ${path}`;
  },
});

/**
 * Write content to a file
 */
export const writeFile = tool({
  description:
    "Write content to a file at the specified path. Creates the file if it doesn't exist, overwrites if it does.",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  execute: async ({ path, content }: { path: string; content: string }) => {
    // Stub implementation
    return `[Stub] Wrote ${content.length} characters to ${path}`;
  },
});

/**
 * List files in a directory
 */
export const listFiles = tool({
  description:
    "List all files and directories in the specified directory path.",
  inputSchema: z.object({
    directory: z
      .string()
      .describe("The directory path to list contents of")
      .default("."),
  }),
  execute: async ({ directory }: { directory: string }) => {
    // Stub implementation
    return `[Stub] Files in ${directory}:\n- file1.ts\n- file2.ts\n- README.md`;
  },
});

/**
 * Delete a file
 */
export const deleteFile = tool({
  description:
    "Delete a file at the specified path. Use with caution as this is irreversible.",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to delete"),
  }),
  execute: async ({ path }: { path: string }) => {
    // Stub implementation
    return `[Stub] Deleted ${path}`;
  },
});
