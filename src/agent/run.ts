import { streamText, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
import { tools } from "./tools/index.ts";
import { executeTool } from "./executeTool.ts";
import { SYSTEM_PROMPT } from "./system/prompt.ts";
import { Laminar } from "@lmnr-ai/lmnr";
import type { AgentCallbacks, ToolCallInfo } from "../types.ts";

Laminar.initialize({
  projectApiKey: process.env.LMNR_API_KEY,
});

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<ModelMessage[]> {
  const messages: ModelMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  let fullResponse = "";

  while (true) {
    const result = streamText({
      model: openai("gpt-5-mini"),
      messages,
      tools,
      experimental_telemetry: {
        isEnabled: true,
        tracer: getTracer(),
      },
    });

    const toolCalls: ToolCallInfo[] = [];
    let currentText = "";

    for await (const chunk of result.fullStream) {
      if (chunk.type === "text-delta") {
        currentText += chunk.text;
        callbacks.onToken(chunk.text);
      }

      if (chunk.type === "tool-call") {
        const input = "input" in chunk ? chunk.input : {};
        toolCalls.push({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: input as Record<string, unknown>,
        });
        callbacks.onToolCallStart(chunk.toolName, input);
      }
    }

    fullResponse += currentText;

    const finishReason = await result.finishReason;

    if (finishReason !== "tool-calls" || toolCalls.length === 0) {
      const responseMessages = await result.response;
      messages.push(...responseMessages.messages);
      break;
    }

    const responseMessages = await result.response;
    messages.push(...responseMessages.messages);

    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        const result = await executeTool(tc.toolName, tc.args);
        callbacks.onToolCallEnd(tc.toolName, result);
        return {
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          result,
        };
      }),
    );

    for (const tr of toolResults) {
      messages.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            output: { type: "text", value: tr.result },
          },
        ],
      });
    }
  }

  callbacks.onComplete(fullResponse);

  return messages;
}
