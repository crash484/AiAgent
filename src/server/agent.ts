import { Agent, type Connection, type ConnectionContext } from "agents";
import { streamText, type ModelMessage } from "ai";
import type { Env, AgentState, ToolCallState } from "../types";
import { createOpenAI } from "@ai-sdk/openai";
import { tools, executeToolCalls, type ToolCall } from "./tools";

// WebSocket message types
interface ChatMessage {
  type: "chat";
  content: string;
}

type ClientMessage = ChatMessage;

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class SupportAgent extends Agent<Env, AgentState> {
  // Initialize state with empty messages array and no current run
  initialState: AgentState = {
    messages: [],
    currentRun: null,
  };

  // SDK automatically syncs state to client via onStateUpdate - no manual sync needed
  onConnect(connection: Connection, ctx: ConnectionContext): void {
    // No-op: SDK handles state sync automatically
  }

  // Handle incoming WebSocket messages
  async onMessage(
    connection: Connection,
    message: string | ArrayBuffer,
  ): Promise<void> {
    try {
      const data: ClientMessage = JSON.parse(message.toString());

      if (data.type === "chat") {
        // Clear any previous run state
        this.clearRun();

        // Append user message to state
        const userMessage: ModelMessage = {
          role: "user",
          content: data.content,
        };
        this.appendMessage(userMessage);

        // Run agent loop (no connection or messages passed)
        await this.runAgentLoop();
      }
    } catch (error) {
      console.error("Error handling message:", error);
      this.errorRun(error instanceof Error ? error.message : "Unknown error");
    }
  }

  // Optional cleanup on disconnect
  onClose(connection: Connection): void {
    // No cleanup needed for now
  }

  // ============ Helper Methods for State Management ============

  // Append a single message to state
  private appendMessage(message: ModelMessage): void {
    this.setState({
      ...this.state,
      messages: [...this.state.messages, message],
    });
  }

  // Append multiple messages at once
  private appendMessages(messages: ModelMessage[]): void {
    this.setState({
      ...this.state,
      messages: [...this.state.messages, ...messages],
    });
  }

  // Start a new run and return the run ID
  private startRun(): string {
    const runId = `run_${generateId()}`;
    this.setState({
      ...this.state,
      currentRun: {
        id: runId,
        status: "streaming",
        textStream: null,
        toolCalls: [],
      },
    });
    return runId;
  }

  // Update text stream content
  private updateTextStream(messageId: string, content: string): void {
    if (!this.state.currentRun) return;
    this.setState({
      ...this.state,
      currentRun: {
        ...this.state.currentRun,
        textStream: { messageId, content },
      },
    });
  }

  // Add a tool call to the current run
  private addToolCall(toolCall: ToolCallState): void {
    if (!this.state.currentRun) return;
    this.setState({
      ...this.state,
      currentRun: {
        ...this.state.currentRun,
        toolCalls: [...this.state.currentRun.toolCalls, toolCall],
      },
    });
  }

  // Update a tool call with its output
  private updateToolOutput(toolCallId: string, output: string): void {
    if (!this.state.currentRun) return;
    this.setState({
      ...this.state,
      currentRun: {
        ...this.state.currentRun,
        toolCalls: this.state.currentRun.toolCalls.map((tc) =>
          tc.toolCallId === toolCallId ? { ...tc, output } : tc,
        ),
      },
    });
  }

  // Mark the current run as completed
  private completeRun(): void {
    if (!this.state.currentRun) return;
    this.setState({
      ...this.state,
      currentRun: { ...this.state.currentRun, status: "done" },
    });
  }

  // Mark the current run as errored
  private errorRun(error: string): void {
    if (!this.state.currentRun) {
      // If no run exists, create one in error state
      this.setState({
        ...this.state,
        currentRun: {
          id: `run_${generateId()}`,
          status: "error",
          textStream: null,
          toolCalls: [],
          error,
        },
      });
    } else {
      this.setState({
        ...this.state,
        currentRun: { ...this.state.currentRun, status: "error", error },
      });
    }
  }

  // Clear the current run state
  private clearRun(): void {
    this.setState({
      ...this.state,
      currentRun: null,
    });
  }

  // ============ Provider and Agent Loop ============

  private getOpenAIProvider() {
    const openai = createOpenAI({
      apiKey: this.env.OPENAI_API_KEY,
    });

    return openai("gpt-4o");
  }

  // Agent loop using state-based streaming
  private async runAgentLoop(): Promise<void> {
    const MAX_ITERATIONS = 10;
    let iterations = 0;

    // Start a new run
    this.startRun();

    // Initialize local messages from current state
    const messages: ModelMessage[] = [...this.state.messages];
    let currentText = "";
    let currentMessageId = `msg_${generateId()}`;

    try {
      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const result = streamText({
          model: this.getOpenAIProvider(),
          system:
            "You are a helpful customer support agent. You have access to tools: getWeather (get weather for a location) and getTime (get current time). Use them when relevant to help the user.",
          messages,
          tools,
        });

        // Stream the response chunks via state updates
        for await (const chunk of result.fullStream) {
          if (chunk.type === "text-delta") {
            currentText += chunk.text;
            this.updateTextStream(currentMessageId, currentText);
          } else if (chunk.type === "tool-call") {
            this.addToolCall({
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
              input: chunk.input,
            });
          }
        }

        // Get the response messages (includes assistant message with tool calls)
        const responseMessages = (await result.response).messages;
        messages.push(...responseMessages);

        // Reset text accumulator for next iteration
        currentText = "";
        currentMessageId = `msg_${generateId()}`;

        // Check if we should continue the loop
        const finishReason = await result.finishReason;
        if (finishReason !== "tool-calls") {
          // No more tool calls, we're done
          break;
        }

        // Get tool calls from the result and execute them
        const toolCalls = await result.toolCalls;
        const toolCallsForExecution: ToolCall[] = toolCalls.map((tc) => ({
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          input: tc.input,
        }));
        const toolResults = await executeToolCalls(toolCallsForExecution);

        // Update tool outputs in state and add to messages
        for (const toolResult of toolResults) {
          this.updateToolOutput(toolResult.toolCallId, toolResult.result);

          // Add tool result to messages for next iteration
          const toolMessage: ModelMessage = {
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolCallId: toolResult.toolCallId,
                toolName: toolResult.toolName,
                output: { type: "text" as const, value: toolResult.result },
              },
            ],
          };
          messages.push(toolMessage);
        }
      }

      // Save all messages to state and mark run as complete
      this.setState({
        ...this.state,
        messages,
        currentRun: this.state.currentRun
          ? { ...this.state.currentRun, status: "done" }
          : null,
      });
    } catch (error) {
      console.error("Agent loop error:", error);
      this.errorRun(error instanceof Error ? error.message : "Unknown error");
    }
  }
}
