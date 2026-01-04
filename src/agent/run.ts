import "dotenv/config";
import {generateText, type ModelMessage} from "ai"
import {google} from "@ai-sdk/google"
import { SYSTEM_PROMPT } from "./system/prompt"
import type { AgentCallbacks } from "../types" 

const MODEL_NAME="gemini-2.5-flash"

export const runAgent = async(
    userMessage: string, 
    conversationHistory: 
    ModelMessage[], 
    callbacks: AgentCallbacks
 )=>{
    const {text} = await generateText({
        model: google(MODEL_NAME),
        prompt: userMessage,
        system: SYSTEM_PROMPT
    });
    console.log(text);
 }

runAgent('my name is shashwat');