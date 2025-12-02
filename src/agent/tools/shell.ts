import { tool } from "ai";
import { z } from "zod";

/**
 * Run a shell command
 */
export const runCommand = tool({
  description:
    "Execute a shell command and return its output. Use this for system operations, running scripts, or interacting with the operating system.",
  inputSchema: z.object({
    command: z.string().describe("The shell command to execute"),
  }),
  execute: async ({ command }: { command: string }) => {
    // Stub implementation - will be replaced with shelljs or child_process
    return `[Stub] Output of: ${command}`;
  },
});
