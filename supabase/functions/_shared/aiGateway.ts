/**
 * Lovable AI Gateway — standardized call layer (Phase 3)
 *
 * Every edge function should route chat/completions through here so that
 * auth, error mapping (429/402/4xx/5xx) and logging are identical everywhere.
 */

export const LOVABLE_AI_CHAT_ENDPOINT = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export type GatewayErrorCode =
  | 'MISSING_API_KEY'
  | 'RATE_LIMITED'
  | 'CREDITS_EXHAUSTED'
  | 'BAD_REQUEST'
  | 'UPSTREAM_ERROR'
  | 'NETWORK_ERROR';

export class GatewayError extends Error {
  code: GatewayErrorCode;
  status: number;
  details?: string;

  constructor(code: GatewayErrorCode, status: number, message: string, details?: string) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface GatewayChatRequest {
  model: string;
  messages: Array<Record<string, unknown>>;
  max_completion_tokens?: number;
  top_p?: number;
  temperature?: number;
  stream?: boolean;
  /** Extra passthrough fields (tools, response_format, ...) */
  extra?: Record<string, unknown>;
}

function mapStatus(status: number, errorText: string): GatewayError {
  if (status === 429) {
    return new GatewayError('RATE_LIMITED', 429, 'Rate limit exceeded. Please try again in a moment.', errorText);
  }
  if (status === 402) {
    return new GatewayError(
      'CREDITS_EXHAUSTED',
      402,
      'AI credits exhausted. Please add credits to your Lovable workspace.',
      errorText
    );
  }
  if (status >= 400 && status < 500) {
    return new GatewayError('BAD_REQUEST', status, `AI request rejected (${status}).`, errorText);
  }
  return new GatewayError('UPSTREAM_ERROR', 502, `AI service error (${status}).`, errorText);
}

/**
 * Raw gateway call. Returns the fetch Response (streaming-safe).
 * Throws GatewayError on any non-2xx or network failure.
 */
export async function callGateway(
  request: GatewayChatRequest,
  scope = 'ai-gateway'
): Promise<Response> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new GatewayError('MISSING_API_KEY', 500, 'LOVABLE_API_KEY is not configured.');
  }

  const { extra, ...rest } = request;
  const body = { ...rest, ...(extra ?? {}) };

  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(LOVABLE_AI_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ [${scope}] network error calling gateway:`, message);
    throw new GatewayError('NETWORK_ERROR', 502, 'Could not reach the AI service.', message);
  }

  const elapsed = Date.now() - startedAt;
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [${scope}] gateway ${response.status} after ${elapsed}ms:`, errorText.slice(0, 800));
    throw mapStatus(response.status, errorText);
  }

  console.log(`✅ [${scope}] gateway ${response.status} in ${elapsed}ms (model: ${request.model}, stream: ${!!request.stream})`);
  return response;
}

/** Non-streaming helper: returns the assistant text content. */
export async function callGatewayText(
  request: GatewayChatRequest,
  scope = 'ai-gateway'
): Promise<string> {
  const response = await callGateway({ ...request, stream: false }, scope);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

/** Convert a GatewayError (or unknown error) into a JSON Response. */
export function gatewayErrorResponse(error: unknown, corsHeaders: Record<string, string>): Response {
  if (error instanceof GatewayError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code, details: error.details }),
      { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  return new Response(
    JSON.stringify({ error: message, code: 'UPSTREAM_ERROR' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
