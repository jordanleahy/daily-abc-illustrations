/**
 * AI Provider Configuration and Utilities
 * Handles API calls via Lovable AI Gateway
 * Supports multiple models: Google Gemini, OpenAI, DeepSeek through a unified gateway
 */

import type { AgentConfig } from './types.ts';
import { callGateway } from './aiGateway.ts';

/**
 * Lovable AI Gateway endpoint (OpenAI-compatible)
 */
const LOVABLE_AI_GATEWAY_ENDPOINT = 'https://ai.gateway.lovable.dev/v1/chat/completions';

/**
 * Get the Lovable API key from environment variables
 */
export function getLovableApiKey(): string | undefined {
  return Deno.env.get('LOVABLE_API_KEY');
}

/**
 * Build request body for Lovable AI Gateway (OpenAI-compatible format)
 * The gateway handles provider-specific formatting internally
 */
export function buildRequestBody(
  agent: AgentConfig,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  options: {
    stream?: boolean;
    temperature?: number;
  } = {}
): Record<string, any> {
  const body: Record<string, any> = {
    model: agent.model, // Should be in format: google/gemini-2.5-flash, openai/gpt-5-mini, etc.
    messages,
    max_completion_tokens: agent.max_completion_tokens,
    top_p: agent.top_p,
  };

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  if (options.stream) {
    body.stream = true;
  }

  return body;
}

/**
 * Make an AI API call via Lovable AI Gateway
 * Delegates to the shared gateway layer so auth, error mapping and logging
 * are identical across every edge function.
 */
export async function callAIProvider(
  agent: AgentConfig,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  options: {
    stream?: boolean;
    temperature?: number;
  } = {}
): Promise<Response> {
  const body = buildRequestBody(agent, messages, options);
  return await callGateway(body as Parameters<typeof callGateway>[0], 'aiProviders');
}


/**
 * Parse AI response content (OpenAI-compatible format from gateway)
 */
export function parseAIResponse(provider: AgentConfig['provider'], responseData: any): string {
  return responseData.choices[0].message.content;
}
