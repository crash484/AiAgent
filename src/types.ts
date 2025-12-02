export interface AgentCallbacks {
  onToken: (token: string) => void;
  onToolCallStart: (name: string, args: unknown) => void;
  onToolCallEnd: (name: string, result: string) => void;
  onComplete: (response: string) => void;
}

export interface ToolCallInfo {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}
