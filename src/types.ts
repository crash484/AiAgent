import type { ModelMessage } from "ai";

export interface Env {
  OPENAI_API_KEY: string;
}

// Tool call state within a run
export interface ToolCallState {
  toolCallId: string;
  toolName: string;
  input: unknown;
  output?: string;
}

// Current run state for streaming
export interface RunState {
  id: string;
  status: "streaming" | "done" | "error";
  textStream: { messageId: string; content: string } | null;
  toolCalls: ToolCallState[];
  error?: string;
}

// Agent state with conversation history and current run
export interface AgentState {
  messages: ModelMessage[];
  currentRun: RunState | null;
}
