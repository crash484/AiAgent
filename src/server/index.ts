import { routeAgentRequest, getAgentByName } from "agents";
import { SupportAgent } from "./agent";

interface Env {
  SupportAgent: DurableObjectNamespace<SupportAgent>;
}

export { SupportAgent };

// CORS headers for local development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-vercel-ai-ui-message-stream",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Route /api/chat to agent via getAgentByName
    if (url.pathname === "/api/chat") {
      // Use a fixed agent name for now (can be per-user in the future)
      const agentId = "default";
      const agent = await getAgentByName(env.SupportAgent, agentId);
      const response = await agent.fetch(request);

      // Add CORS headers to response
      const newHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // Try standard agent routing for other paths
    const response = await routeAgentRequest(request, env);
    if (response) {
      return response;
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
