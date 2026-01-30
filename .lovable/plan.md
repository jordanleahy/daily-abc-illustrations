# Shared Agent Orchestration Utility for Edge Functions

## Status: ✅ IMPLEMENTED

Implementation completed on 2026-01-30.

## Summary

Created `supabase/functions/_shared/agentOrchestration.ts` as a centralized utility that consolidates agent selection, fallback logic, and performance metrics tracking across edge functions.

## Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/agentOrchestration.ts` | Core orchestration utility (~350 lines) |

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/google-create-book/index.ts` | Replaced ~115 lines with shared utility calls |
| `supabase/functions/google-chat/index.ts` | Replaced ~50 lines with shared utility calls |

## Key Features

### Agent Selection (`selectAgent`, `selectChatAgent`)
- Specialized → Generic → Inline fallback priority chain
- Configurable minimum prompt length validation
- Full vs lightweight agent record variants

### Model Settings (`getModelSettings`)
- Safe defaults for model, max_tokens, top_p
- Range validation with fallback

### Performance Metrics (`createPerformanceMetric`, `completePerformanceMetric`)
- Non-blocking async tracking
- Structured metadata capture
- Completion data updates

### Fallback Prompts (`getInlineFallbackPrompt`)
- Book-type-specific inline prompts
- Consistent discovery experience

### Logging (`logOrchestration`)
- Structured logging format
- Consistent `[AgentOrchestration]` prefix

## Usage Examples

```typescript
// Book creation (full agent record required)
const { agent, source, agentType, error } = await selectAgent(supabase, {
  bookType,
  requireAgent: true,
  minPromptLength: 500
});

// Chat (lightweight agent record)
const { agent, source, agentType } = await selectChatAgent(supabase, bookType);

// Model settings
const modelSettings = getModelSettings(agent);

// Performance tracking
const metricId = await createPerformanceMetric(supabase, { ... });
await completePerformanceMetric(supabase, metricId, { bookId, bookCreated: true });
```
