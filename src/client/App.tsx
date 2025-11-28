import { useState, useCallback, useMemo } from "react";
import { useAgent } from "agents/react";
import { ChatContainer } from "./components";
import type { Message, ServerStateMessage, AgentState } from "./types";

// Generate unique IDs for messages
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract text content from server message (handles both string and array formats)
function extractContent(content: string | unknown[]): string {
  if (typeof content === "string") {
    return content;
  }

  // AI SDK ModelMessage format: content is array of content parts
  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is { type: string; text?: string } =>
          typeof part === "object" && part !== null && "type" in part,
      )
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
  }

  return "";
}

// Convert server state messages to client format
function convertServerMessages(
  serverMessages: ServerStateMessage[],
): Message[] {
  return serverMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, index) => ({
      id: `sync_${index}`,
      role: m.role as "user" | "assistant",
      content: extractContent(m.content),
      status: "complete" as const,
    }));
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  const handleStateUpdate = useCallback((state: AgentState) => {
    // Update messages from state
    setMessages(convertServerMessages(state.messages));

    // Update streaming state from currentRun
    if (state.currentRun && state.currentRun.status === "streaming") {
      setIsStreaming(true);

      if (state.currentRun.textStream) {
        setStreamingMessageId(state.currentRun.textStream.messageId);
        setStreamingContent(state.currentRun.textStream.content);
      } else {
        setStreamingContent(null);
        setStreamingMessageId(null);
      }
    } else {
      // Run is done or doesn't exist - clear streaming state
      setIsStreaming(false);
      setStreamingContent(null);
      setStreamingMessageId(null);
    }
  }, []);

  const agent = useAgent({
    agent: "SupportAgent",
    name: "default",
    onStateUpdate: handleStateUpdate,
    onOpen: () => {
      setIsConnected(true);
    },
    onClose: () => {
      setIsConnected(false);
      setIsStreaming(false);
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!agent || isStreaming) return;

      // Send to agent (state update will add the message)
      agent.send(JSON.stringify({ type: "chat", content }));
    },
    [agent, isStreaming],
  );

  // Merge streaming content with messages for display
  const displayMessages = useMemo(() => {
    if (!streamingContent || !streamingMessageId) {
      return messages;
    }

    // Check if streaming message already exists in messages
    const existingIdx = messages.findIndex((m) => m.id === streamingMessageId);
    if (existingIdx >= 0) {
      // Update existing message
      return messages.map((m, i) =>
        i === existingIdx
          ? { ...m, content: streamingContent, status: "streaming" as const }
          : m,
      );
    }

    // Add new streaming message
    return [
      ...messages,
      {
        id: streamingMessageId,
        role: "assistant" as const,
        content: streamingContent,
        status: "streaming" as const,
      },
    ];
  }, [messages, streamingContent, streamingMessageId]);

  // Show loading state while connecting
  if (!isConnected) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatContainer
      messages={displayMessages}
      onSend={sendMessage}
      isStreaming={isStreaming}
    />
  );
}
