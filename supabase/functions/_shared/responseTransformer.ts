/**
 * Response Transformer for Structured Agent Output
 * Converts JSON Schema-enforced responses to [SUGGEST] block format
 * for backward compatibility with frontend parsing
 */

export interface StructuredAgentResponse {
  message: string;
  suggestions: Array<{ id: string; label: string }>;
  metadata?: {
    confirmedPageCount?: number;
    currentStep?: string;
  };
}

/**
 * Transforms structured JSON response into [SUGGEST] block format
 * for backward compatibility with frontend parsing
 * 
 * @param response - Structured agent response with message and suggestions
 * @returns Formatted string with [SUGGEST] blocks or plain message
 * 
 * @example
 * // With suggestions
 * transformToSuggestBlock({
 *   message: "What theme?",
 *   suggestions: [
 *     { id: "paw-patrol", label: "🐾 Paw Patrol" },
 *     { id: "frozen", label: "❄️ Frozen" }
 *   ]
 * })
 * // Returns: "What theme?\n\n[SUGGEST]\npaw-patrol: 🐾 Paw Patrol\nfrozen: ❄️ Frozen\n[/SUGGEST]"
 * 
 * @example
 * // Without suggestions (open-ended question)
 * transformToSuggestBlock({
 *   message: "What custom theme would you like?",
 *   suggestions: []
 * })
 * // Returns: "What custom theme would you like?"
 */
export function transformToSuggestBlock(response: StructuredAgentResponse): string {
  const { message, suggestions } = response;
  
  // If no suggestions, return message only (open-ended question)
  if (!suggestions || suggestions.length === 0) {
    return message;
  }
  
  // Build [SUGGEST] block from suggestions array
  const suggestBlock = suggestions
    .map(s => `${s.id}: ${s.label}`)
    .join('\n');
  
  return `${message}\n\n[SUGGEST]\n${suggestBlock}\n[/SUGGEST]`;
}

/**
 * Validates structured response schema
 * Ensures response matches expected StructuredAgentResponse interface
 * 
 * @param data - Data to validate
 * @returns True if data matches schema, false otherwise
 */
export function validateStructuredResponse(data: any): data is StructuredAgentResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.message === 'string' &&
    Array.isArray(data.suggestions) &&
    data.suggestions.every(
      (s: any) => 
        typeof s === 'object' &&
        typeof s.id === 'string' &&
        typeof s.label === 'string'
    )
  );
}

/**
 * JSON Schema definition for agent responses
 * Used by Lovable AI Gateway for structured output enforcement
 */
export const AGENT_RESPONSE_SCHEMA = {
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
          id: {
            type: "string",
            description: "Machine-readable identifier (e.g., 'paw-patrol', 'lowercase', 'approve')"
          },
          label: {
            type: "string",
            description: "Human-readable display text (e.g., 'Paw Patrol', 'lowercase letters', 'Looks perfect!')"
          }
        },
        required: ["id", "label"],
        additionalProperties: false
      }
    }
  },
  required: ["message", "suggestions"],
  additionalProperties: false
};
