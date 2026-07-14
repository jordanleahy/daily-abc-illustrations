/**
 * Utility to handle Lovable AI Gateway errors (402/429/422) and surface
 * the exact underlying message + code so the UI can display them verbatim.
 */

export interface LovableAiError {
  isCreditsExhausted: boolean;
  isRateLimited: boolean;
  isNoImageGenerated: boolean;
  isModerationBlocked: boolean;
  /** User-friendly summary (used as toast description) */
  message: string;
  /** Exact underlying error message from the backend / gateway, if any */
  rawMessage: string;
  /** Error code from the backend (e.g. NO_IMAGE_GENERATED, content_policy_violation) */
  code: string;
  /** HTTP status code if the client surfaced one (402, 429, 422, 500, ...) */
  status: number | null;
  /** Full JSON blob of everything we saw — useful for the details panel */
  raw: unknown;
}

function pickString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return '';
}

/**
 * Parse an error from a Supabase function invoke that calls Lovable AI.
 * Returns everything we could extract so the UI can render it verbatim.
 */
export function parseLovableAiError(error: any, data?: any): LovableAiError {
  const rawMessage = pickString(
    typeof data?.error === 'string' ? data.error : undefined,
    data?.error?.message,
    data?.message,
    error?.context?.error,
    error?.context?.message,
    error?.message,
  );

  const code = pickString(
    data?.errorCode,
    data?.code,
    data?.error?.code,
    data?.error?.type,
    error?.code,
    error?.name,
  );

  const status: number | null =
    (typeof error?.status === 'number' && error.status) ||
    (typeof error?.context?.status === 'number' && error.context.status) ||
    (typeof data?.status === 'number' && data.status) ||
    null;

  const haystack = `${rawMessage} ${code} ${status ?? ''}`.toLowerCase();

  const isCreditsExhausted =
    haystack.includes('credits') ||
    haystack.includes('402') ||
    haystack.includes('payment required') ||
    status === 402;

  const isRateLimited =
    haystack.includes('rate limit') ||
    haystack.includes('429') ||
    haystack.includes('too many requests') ||
    status === 429;

  const isNoImageGenerated =
    code === 'NO_IMAGE_GENERATED' ||
    haystack.includes("couldn't generate") ||
    haystack.includes('no image');

  const isModerationBlocked =
    haystack.includes('content_policy_violation') ||
    haystack.includes('moderation_blocked') ||
    haystack.includes('safety') ||
    haystack.includes('policy violation');

  let summary: string;
  if (isCreditsExhausted) {
    summary = 'Lovable AI credits exhausted. Add credits in Settings → Workspace → Usage.';
  } else if (isRateLimited) {
    summary = 'Rate limit exceeded. Please wait a moment and try again.';
  } else if (isModerationBlocked) {
    summary = 'Blocked by content safety (often character names like Bluey or Elsa).';
  } else if (isNoImageGenerated) {
    summary = "The AI couldn't generate the image.";
  } else if (rawMessage) {
    summary = rawMessage;
  } else {
    summary = 'Could not generate image';
  }

  // Compose the toast description: real message + code + status when present.
  const parts: string[] = [rawMessage || summary];
  const meta: string[] = [];
  if (code) meta.push(`code: ${code}`);
  if (status != null) meta.push(`status: ${status}`);
  if (meta.length) parts.push(`[${meta.join(' • ')}]`);
  const message = parts.join(' ');

  return {
    isCreditsExhausted,
    isRateLimited,
    isNoImageGenerated,
    isModerationBlocked,
    message,
    rawMessage,
    code,
    status,
    raw: { data, error: serializeError(error) },
  };
}

function serializeError(error: any) {
  if (!error) return null;
  if (typeof error !== 'object') return error;
  const out: Record<string, unknown> = {};
  for (const k of ['name', 'message', 'code', 'status', 'context']) {
    if (k in error) out[k] = (error as any)[k];
  }
  return out;
}

/**
 * Convenience: user-friendly + code/status string suitable for a toast description.
 */
export function getLovableAiErrorMessage(error: any, data?: any): string {
  return parseLovableAiError(error, data).message;
}
