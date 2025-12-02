import { tools } from './tools/index.ts';

export type ToolName = keyof typeof tools;

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'sampleTool': {
      const execute = tools.sampleTool.execute;
      if (!execute) {
        return `Tool ${name} has no execute function`;
      }
      const result = await execute(args as { input: string }, {
        toolCallId: '',
        messages: [],
      });
      return String(result);
    }
    default:
      return `Unknown tool: ${name}`;
  }
}
