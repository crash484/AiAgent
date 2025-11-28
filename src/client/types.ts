// Client-side message type
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "pending" | "streaming" | "complete" | "error";
}

// Server-side message format (from agent state)
export interface ServerStateMessage {
  role: "user" | "assistant" | "tool";
  content: string | unknown[];
}

// Tool call state from agent
export interface ToolCallState {
  toolCallId: string;
  toolName: string;
  input: unknown;
  output?: string;
}

// Run state from agent
export interface RunState {
  id: string;
  status: "streaming" | "done" | "error";
  textStream: { messageId: string; content: string } | null;
  toolCalls: ToolCallState[];
  error?: string;
}

// Agent state shape (received via onStateUpdate)
export interface AgentState {
  messages: ServerStateMessage[];
  currentRun: RunState | null;
}
