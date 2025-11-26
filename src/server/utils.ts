import { createOpenAI } from "@ai-sdk/openai";

export const createOpenAIProvider = (apiKey: string) => {
  return createOpenAI({
    apiKey,
  });
};
