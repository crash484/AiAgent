import type { ModelMessage } from "ai";

export interface Env {
  OPENAI_API_KEY: string;
}

// Agent state with conversation history (uses AI SDK ModelMessage format)
export interface AgentState {
  messages: ModelMessage[];
}
