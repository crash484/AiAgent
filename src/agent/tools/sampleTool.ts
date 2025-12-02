import { tool } from 'ai';
import { z } from 'zod';

export const sampleTool = tool({
  description: 'A sample tool that returns static text. Use this to test the agent loop.',
  inputSchema: z.object({
    input: z.string().describe('Any input string to echo back'),
  }),
  execute: async ({ input }: { input: string }) => {
    return `Sample response for: ${input}`;
  },
});
