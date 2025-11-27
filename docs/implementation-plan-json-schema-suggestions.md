# JSON Schema Structured Output Implementation Plan

## Executive Summary

This plan outlines the migration from instruction-based `[SUGGEST]` blocks to API-enforced JSON Schema structured output for all book creation agents. The approach guarantees 99%+ consistency while maintaining full agent flexibility over content and ensuring backward compatibility with existing frontend parsing.

---

## 1. Core Architecture

### 1.1 JSON Schema Design

```typescript
const agentResponseSchema = {
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
```

### 1.2 Agent Flexibility Preserved

**What is enforced (structure):**
- Response must be valid JSON
- Must contain `message` (string) and `suggestions` (array)
- Each suggestion must have `id` and `label`

**What remains flexible (content):**
- Actual message text (agent decides wording)
- Number of suggestions (0 to N)
- Suggestion IDs and labels (agent decides values)
- When to provide suggestions vs empty array

**Examples of agent control:**

```json
// Theme selection - agent provides specific options
{
  "message": "Which character theme would you like?",
  "suggestions": [
    {"id": "paw-patrol", "label": "🐾 Paw Patrol"},
    {"id": "frozen", "label": "❄️ Frozen"},
    {"id": "custom", "label": "✏️ Custom Theme"}
  ]
}

// Custom theme follow-up - agent asks open-ended question
{
  "message": "What custom theme would you like? For example: dinosaurs, space, unicorns, pirates, etc.",
  "suggestions": []
}

// Title approval - agent provides specific actions
{
  "message": "Here's the book title and description:\n\n**Mountain Village A-Z**\n\nDoes this sound good?",
  "suggestions": [
    {"id": "approve", "label": "✅ Looks perfect!"},
    {"id": "edit-title", "label": "📝 Change title"},
    {"id": "edit-description", "label": "📄 Change description"}
  ]
}
```

---

## 2. Implementation Phases

### Phase 1: Backend Infrastructure (Week 1)

**2.1 Update Lovable AI Gateway Integration**

File: `supabase/functions/_shared/aiProviders.ts`

```typescript
// Add to buildRequestBody function
export function buildRequestBody(
  agent: AgentConfig,
  messages: Array<MessageType>,
  options: { 
    stream?: boolean; 
    temperature?: number;
    useStructuredOutput?: boolean; // NEW PARAMETER
  } = {}
): Record<string, any> {
  const body: Record<string, any> = {
    model: agent.modelSettings.model,
    messages: [
      { role: "system", content: agent.instructions },
      ...messages
    ],
    max_completion_tokens: agent.modelSettings.maxCompletionTokens,
    top_p: agent.modelSettings.topP,
    stream: options.stream ?? false,
  };

  // Add temperature only for models that support it
  if (options.temperature !== undefined && !isReasoningModel(agent.modelSettings.model)) {
    body.temperature = options.temperature;
  }

  // NEW: Add structured output for non-streaming requests
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
```

**2.2 Create Response Transformer**

File: `supabase/functions/_shared/responseTransformer.ts` (NEW FILE)

```typescript
export interface StructuredAgentResponse {
  message: string;
  suggestions: Array<{ id: string; label: string }>;
}

/**
 * Transforms structured JSON response into [SUGGEST] block format
 * for backward compatibility with frontend parsing
 */
export function transformToSuggestBlock(response: StructuredAgentResponse): string {
  const { message, suggestions } = response;
  
  // If no suggestions, return message only
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
```

**2.3 Update google-chat Edge Function**

File: `supabase/functions/google-chat/index.ts`

Key changes:
- Add `useStructuredOutput: true` to `callAIProvider` options
- Parse JSON response from AI
- Transform to `[SUGGEST]` block format before returning
- Add error handling for invalid JSON

```typescript
// Around line 350-370 (AI response handling section)
const response = await callAIProvider(
  agentConfig,
  apiMessages,
  { 
    stream: true,
    useStructuredOutput: true // Enable structured output
  }
);

// For non-streaming, parse and transform response
if (!stream) {
  const responseData = await response.json();
  const content = parseAIResponse(agentConfig.provider, responseData);
  
  try {
    const structuredResponse = JSON.parse(content);
    
    if (!validateStructuredResponse(structuredResponse)) {
      throw new Error('Invalid structured response format');
    }
    
    // Transform to [SUGGEST] block format for backward compatibility
    const suggestBlockFormat = transformToSuggestBlock(structuredResponse);
    
    return new Response(
      JSON.stringify({ content: suggestBlockFormat }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (parseError) {
    console.error('Failed to parse structured response:', content);
    // Fallback: return raw content
    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
```

### Phase 2: Agent Prompt Migration (Week 2)

**2.4 Update All Specialized Agent Prompts**

For each specialized agent (ABC, Rhyming, Opposites, Emotions, etc.):

**REMOVE:**
- All `[SUGGEST]...[/SUGGEST]` block instructions
- "OUTPUT THIS EXACTLY" markers
- Enforcement rules about regenerating responses

**ADD:**
- JSON response format explanation
- When to include suggestions vs empty array
- Examples of properly formatted JSON responses

**Example Migration (ABC Agent):**

```markdown
## Response Format

You MUST respond with valid JSON in this exact format:

{
  "message": "Your conversational message to the user",
  "suggestions": [
    {"id": "machine-id", "label": "Display Text"},
    {"id": "another-id", "label": "Another Option"}
  ]
}

### When to Include Suggestions

**Include suggestions (array with items)** when:
- Asking user to make a choice (theme, age, letter case, approval)
- Presenting multiple options
- User needs to select from predefined options

**Use empty suggestions array** when:
- Asking open-ended questions (custom theme, custom topic)
- Requesting free-form text input
- Following up after user provides custom input

### Discovery Step Examples

**Step 1: Theme Selection**
```json
{
  "message": "Which character theme would you like for your ABC book?",
  "suggestions": [
    {"id": "mountain-village", "label": "🏔️ Mountain Village A-Z"},
    {"id": "paw-patrol", "label": "🐾 Paw Patrol"},
    {"id": "frozen", "label": "❄️ Frozen"},
    {"id": "custom", "label": "✏️ Custom Theme"}
  ]
}
```

**Step 1b: Custom Theme Follow-up**
```json
{
  "message": "What custom theme would you like? For example: dinosaurs, space, unicorns, pirates, etc.",
  "suggestions": []
}
```

**Step 2: Age Selection**
```json
{
  "message": "What age group is this book for?",
  "suggestions": [
    {"id": "1-2", "label": "1-2 years"},
    {"id": "2-3", "label": "2-3 years"},
    {"id": "3-4", "label": "3-4 years"},
    {"id": "4-5", "label": "4-5 years"}
  ]
}
```

**Step 5: Title Approval**
```json
{
  "message": "Here's the book title and description:\n\n**Mountain Village A-Z**\nExplore cozy village life from A to Z with warm illustrations of bakeries, cottages, and friendly neighbors.\n\nDoes this sound good?",
  "suggestions": [
    {"id": "approve", "label": "✅ Looks perfect!"},
    {"id": "edit-title", "label": "📝 Change title"},
    {"id": "edit-description", "label": "📄 Change description"}
  ]
}
```
```

**2.5 Migration Script for All Agents**

Create database migration to update all 12 specialized agents:

```sql
-- Update all specialized book creation agents with JSON response format
UPDATE agents
SET 
  instructions = REPLACE(
    REPLACE(
      instructions,
      '## CRITICAL: [SUGGEST] Block Enforcement

EVERY response that asks the user to make a choice MUST contain exactly one [SUGGEST]...[/SUGGEST] block.',
      '## Response Format

You MUST respond with valid JSON in this exact format:

{
  "message": "Your conversational message to the user",
  "suggestions": [
    {"id": "machine-id", "label": "Display Text"}
  ]
}

Include suggestions array when asking user to make a choice. Use empty suggestions array [] for open-ended questions.'
    ),
    '[SUGGEST]',
    '```json'
  ),
  updated_at = NOW()
WHERE type IN (
  'book-creation-abc',
  'book-creation-rhyming', 
  'book-creation-opposites',
  'book-creation-emotions',
  'book-creation-animals',
  'book-creation-bedtime',
  'book-creation-colors',
  'book-creation-cvc',
  'book-creation-first-words',
  'book-creation-numbers',
  'book-creation-shapes',
  'book-creation-sight-words'
)
AND is_latest = true;
```

### Phase 3: Testing & Validation (Week 3)

**2.6 Testing Strategy**

**Unit Tests:**
- Test `transformToSuggestBlock` with various inputs
- Test `validateStructuredResponse` with valid/invalid data
- Test schema enforcement at API level

**Integration Tests:**
- Test each specialized agent's discovery flow
- Verify suggestions render as buttons
- Verify open-ended questions work (empty suggestions)
- Verify custom theme/topic follow-ups

**QA Checklist per Agent:**
1. ✅ Character theme selection displays thumbnails
2. ✅ Age selection displays as buttons
3. ✅ Type-specific discovery (letter case, rhyme pattern, etc.) displays as buttons
4. ✅ Custom theme follow-up shows text input (no buttons)
5. ✅ Title/description approval displays action buttons
6. ✅ All responses are valid JSON
7. ✅ Frontend parsing works correctly
8. ✅ No hardcoded fallbacks triggered

**2.7 Rollback Plan**

If issues arise:
1. Set `useStructuredOutput: false` in `callAIProvider` options
2. Revert agent prompt migrations via database rollback
3. System falls back to instruction-based `[SUGGEST]` blocks
4. Investigate root cause before re-attempting

---

## 3. Benefits Summary

### 3.1 Consistency
- **Current:** ~60-70% consistency (agents frequently skip `[SUGGEST]` blocks)
- **After Migration:** 99%+ consistency (API-level enforcement)

### 3.2 Maintainability
- **Current:** Requires hardcoded fallback patterns in `useGoogleChat.ts` for each agent and discovery step
- **After Migration:** No fallbacks needed; single transformation function

### 3.3 Developer Experience
- **Current:** Must maintain agent instructions + frontend fallbacks in sync
- **After Migration:** Agent prompts focus on content only; structure guaranteed

### 3.4 Debugging
- **Current:** Hard to diagnose why agent skipped `[SUGGEST]` block
- **After Migration:** Invalid responses caught immediately with clear error messages

---

## 4. Risk Mitigation

### 4.1 API Compatibility
**Risk:** JSON schema not supported by all Lovable AI Gateway models  
**Mitigation:** Test with `google/gemini-2.5-flash` (primary model); add fallback flag

### 4.2 Streaming Support
**Risk:** Structured output may not work with streaming  
**Mitigation:** Use structured output for non-streaming only; keep instruction-based for streaming if needed

### 4.3 Breaking Changes
**Risk:** Frontend breaks if transformation fails  
**Mitigation:** Comprehensive error handling + fallback to raw content

### 4.4 Agent Confusion
**Risk:** Agents confused by JSON format in prompts  
**Mitigation:** Clear examples + explicit instructions in every agent prompt

---

## 5. Success Metrics

- ✅ 99%+ of agent responses include valid JSON structure
- ✅ 0 hardcoded fallback patterns triggered in frontend
- ✅ All 12 specialized agents pass QA checklist
- ✅ No regression in book creation success rate
- ✅ Reduced time-to-debug suggestion rendering issues

---

## 6. Timeline

- **Week 1:** Backend infrastructure (aiProviders, responseTransformer, google-chat)
- **Week 2:** Agent prompt migration (all 12 specialized agents)
- **Week 3:** Testing, QA, and production deployment

**Total:** 3 weeks to full migration with backward compatibility maintained throughout.
