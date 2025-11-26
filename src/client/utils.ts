import type {
  ThreadMessage,
  ChatModelAdapter,
  ChatModelRunResult,
} from "@assistant-ui/react";
import type { CoreMessage } from "ai";

// Convert server messages (CoreMessage format) to assistant-ui format
export function convertToThreadMessages(
  messages: CoreMessage[],
): ThreadMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, index) => {
      const base = {
        id: `msg-${index}`,
        role: m.role as "user" | "assistant",
        content: [
          {
            type: "text" as const,
            text: typeof m.content === "string" ? m.content : "",
          },
        ],
        createdAt: new Date(),
        metadata: {},
      };

      // Only assistant messages have status
      if (m.role === "assistant") {
        return {
          ...base,
          status: { type: "complete" as const, reason: "stop" as const },
        };
      }

      // User messages have attachments instead
      return {
        ...base,
        attachments: [],
      };
    }) as unknown as ThreadMessage[];
}

// Fetch conversation history from server
export async function fetchChatHistory(): Promise<ThreadMessage[]> {
  const response = await fetch("/api/chat");
  if (!response.ok) {
    return [];
  }
  const data: { messages?: CoreMessage[] } = await response.json();
  if (data.messages && data.messages.length > 0) {
    return convertToThreadMessages(data.messages);
  }
  return [];
}

// Custom ChatModelAdapter that connects to our /api/chat endpoint
export const chatModelAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }): AsyncGenerator<ChatModelRunResult> {
    // Get the latest user message to send to server
    const lastMessage = messages[messages.length - 1];
    const userContent =
      lastMessage.role === "user"
        ? lastMessage.content
            .filter(
              (c): c is { type: "text"; text: string } => c.type === "text",
            )
            .map((c) => c.text)
            .join("")
        : "";

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: { role: "user", content: userContent },
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const eventData = line.slice(6);
        if (eventData === "[DONE]") continue;

        try {
          const parsed = JSON.parse(eventData) as {
            type: string;
            delta?: string;
          };

          if (parsed.type === "text-delta" && parsed.delta) {
            currentText += parsed.delta;
            yield {
              content: [{ type: "text" as const, text: currentText }],
            };
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  },
};
