/**
 * AI Provider Configuration and Utilities
 * Handles API calls via Lovable AI Gateway
 * Supports multiple models: Google Gemini, OpenAI, DeepSeek through a unified gateway
 */

import type { AgentConfig } from './types.ts';

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
    useStructuredOutput?: boolean;
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

  // Add structured output for non-streaming requests
  if (options.useStructuredOutput && !options.stream) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "agent_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The conversational message to display to the user"
            },
            suggestions: {
              type: "array",
              description: "Optional array of clickable button suggestions. Empty array for open-ended questions.",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" }
                },
                required: ["id", "label"],
                additionalProperties: false
              }
            }
          },
          required: ["message", "suggestions"],
          additionalProperties: false
        }
      }
    };
  }

  return body;
}

/**
 * Make an AI API call via Lovable AI Gateway
 * The gateway automatically routes to the appropriate provider based on model name
 */
export async function callAIProvider(
  agent: AgentConfig,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  options: {
    stream?: boolean;
    temperature?: number;
    useStructuredOutput?: boolean;
  } = {}
): Promise<Response> {
  const apiKey = getLovableApiKey();
  
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const body = buildRequestBody(agent, messages, options);
  console.log(`Calling Lovable AI Gateway with model: ${agent.model}`);

  const response = await fetch(LOVABLE_AI_GATEWAY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Lovable AI Gateway Error:`, response.status, errorText);
    
    // Handle specific error codes
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
    }
    
    throw new Error(`Lovable AI Gateway error: ${response.status} - ${errorText}`);
  }

  return response;
}

/**
 * Parse AI response content (OpenAI-compatible format from gateway)
 */
export function parseAIResponse(provider: AgentConfig['provider'], responseData: any): string {
  return responseData.choices[0].message.content;
}
