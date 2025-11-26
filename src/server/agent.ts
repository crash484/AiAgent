import { Agent, type Connection } from "agents";
import { streamText, type ModelMessage } from "ai";
import type { Env, AgentState } from "../types";
import { createOpenAI } from "@ai-sdk/openai";

export class SupportAgent extends Agent<Env, AgentState> {
  // Initialize state with empty messages array
  initialState: AgentState = {
    messages: [],
  };

  // Keep WebSocket handler for reference (not actively used)
  onMessage(connection: Connection, message: string | ArrayBuffer): void {
    connection.send("hello world");
  }

  private getOpenAIProvider() {
    const openai = createOpenAI({
      apiKey: this.env.OPENAI_API_KEY,
    });

    return openai("gpt-5-mini");
  }

  // HTTP/SSE handler for chat requests
  async onRequest(request: Request): Promise<Response> {
    // Handle GET requests - return conversation history
    if (request.method === "GET") {
      return new Response(JSON.stringify({ messages: this.state.messages }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only handle POST requests for chat
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Parse the request body - expects a single message
    let body: { message?: { role: string; content: string } };
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (!body.message || typeof body.message.content !== "string") {
      return new Response("Missing message object", { status: 400 });
    }

    // Append user message to state
    const userMessage: ModelMessage = {
      role: "user",
      content: body.message.content,
    };
    const updatedMessages = [...this.state.messages, userMessage];
    this.setState({
      ...this.state,
      messages: updatedMessages,
    });

    // Call the LLM with conversation history
    const result = streamText({
      model: this.getOpenAIProvider(),
      system: "You are a helpful customer support agent.",
      messages: updatedMessages,
      onFinish: async ({ text }) => {
        // Save assistant response to state after streaming completes
        const assistantMessage: ModelMessage = {
          role: "assistant",
          content: text,
        };
        this.setState({
          ...this.state,
          messages: [...this.state.messages, assistantMessage],
        });
      },
    });

    // Return streaming response using AI SDK's built-in formatting
    return result.toUIMessageStreamResponse();
  }
}
