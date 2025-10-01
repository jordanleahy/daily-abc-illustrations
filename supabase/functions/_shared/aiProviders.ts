/**
 * AI Provider Configuration and Utilities
 * Handles API calls to multiple AI providers (OpenAI, DeepSeek)
 */

import type { AgentConfig } from './types.ts';

/**
 * AI Provider API endpoints
 */
const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
} as const;

/**
 * Get the API endpoint for a given provider
 */
export function getProviderEndpoint(provider: AgentConfig['provider']): string {
  return PROVIDER_ENDPOINTS[provider];
}

/**
 * Get the API key for a given provider from environment variables
 */
export function getProviderApiKey(provider: AgentConfig['provider']): string | undefined {
  if (provider === 'openai') {
    return Deno.env.get('OPENAI_API_KEY');
  } else if (provider === 'deepseek') {
    return Deno.env.get('DEEPSEEK_API_KEY');
  }
  return undefined;
}

/**
 * Check if a model uses legacy parameter format (max_tokens instead of max_completion_tokens)
 */
export function isLegacyModel(model: string): boolean {
  const legacyModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  return legacyModels.some(legacy => model.includes(legacy));
}

/**
 * Build OpenAI-compatible request body with proper parameter handling
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
    model: agent.model,
    messages,
    top_p: agent.top_p,
  };

  // Handle legacy vs new models for OpenAI
  if (agent.provider === 'openai') {
    if (isLegacyModel(agent.model)) {
      body.max_tokens = agent.max_completion_tokens;
      if (options.temperature !== undefined) {
        body.temperature = options.temperature;
      }
    } else {
      body.max_completion_tokens = agent.max_completion_tokens;
      // Newer models don't support temperature parameter
    }
  } else if (agent.provider === 'deepseek') {
    // DeepSeek uses OpenAI-compatible format
    body.max_tokens = agent.max_completion_tokens;
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
  }

  if (options.stream) {
    body.stream = true;
  }

  return body;
}

/**
 * Make an AI API call with provider-specific configuration
 */
export async function callAIProvider(
  agent: AgentConfig,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  options: {
    stream?: boolean;
    temperature?: number;
  } = {}
): Promise<Response> {
  const apiKey = getProviderApiKey(agent.provider);
  
  if (!apiKey) {
    throw new Error(`${agent.provider.toUpperCase()}_API_KEY is not configured`);
  }

  const endpoint = getProviderEndpoint(agent.provider);
  const body = buildRequestBody(agent, messages, options);

  console.log(`Calling ${agent.provider} API with model: ${agent.model}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${agent.provider} API Error:`, response.status, errorText);
    throw new Error(`${agent.provider} API error: ${response.status} - ${errorText}`);
  }

  return response;
}
