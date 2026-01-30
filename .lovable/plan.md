
# Shared Agent Orchestration Utility for Edge Functions

## Problem Statement

Agent selection, fallback logic, and performance metrics tracking are currently **duplicated** across two major edge functions:

| Function | Lines of Agent Logic | Duplication |
|----------|---------------------|-------------|
| `google-chat/index.ts` | ~100 lines | Agent fetch, fallback prompt, model config |
| `google-create-book/index.ts` | ~100 lines | Agent fetch, fallback, metrics, validation |

This creates:
- Maintenance burden when updating agent selection logic
- Inconsistent error handling between functions
- Risk of logic drift (one function handles edge cases differently)
- Duplicated performance metrics code

## Current Architecture (Identified Issues)

```text
┌─────────────────────────────────────────────────────────────┐
│              google-chat/index.ts                            │
│  ├── fetchAgentTypeMap() call                               │
│  ├── supabase.from('agents').select().eq('type')           │
│  ├── Inline fallback prompt                                 │
│  ├── Model settings extraction (model, max_tokens, top_p)  │
│  └── Shared template interpolation                          │
└─────────────────────────────────────────────────────────────┘
                              ↓ (Duplicated)
┌─────────────────────────────────────────────────────────────┐
│           google-create-book/index.ts                        │
│  ├── fetchAgentTypeMap() call                               │
│  ├── supabase.from('agents').select().eq('type')           │
│  ├── supabase.from('agents').select().eq('type')           │ ← Fallback query
│  ├── Performance metrics insert                             │
│  ├── Prompt length validation                               │
│  └── Detailed orchestration logging                         │
└─────────────────────────────────────────────────────────────┘
```

## Proposed Solution

Create `supabase/functions/_shared/agentOrchestration.ts` as a centralized utility that:

1. **Selects agents** with fallback logic (specialized → generic → inline fallback)
2. **Tracks performance metrics** consistently across all functions
3. **Validates agent configuration** (prompt length, required fields)
4. **Provides structured logging** for debugging and monitoring
5. **Handles model settings** extraction with safe defaults

## Implementation Details

### New File: `supabase/functions/_shared/agentOrchestration.ts`

```typescript
/**
 * Shared Agent Orchestration Utility
 * 
 * Centralizes agent selection, fallback logic, and performance metrics
 * for all edge functions that use AI agents.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { fetchAgentTypeMap, type AgentType } from './agentTypes.ts';

// ============================================
// TYPES
// ============================================

export interface AgentRecord {
  id: string;
  name: string;
  type: AgentType;
  version: string;
  instructions: string;
  model: string;
  max_completion_tokens: number;
  top_p: number;
  provider: string;
}

export interface AgentSelectionResult {
  agent: AgentRecord | null;
  source: 'specialized' | 'generic-fallback' | 'inline-fallback';
  agentType: AgentType;
  error?: string;
}

export interface OrchestrationConfig {
  bookType?: string;
  requireAgent?: boolean;  // If true, fails when no agent found
  minPromptLength?: number; // Minimum instruction length (default: 500)
}

export interface PerformanceMetricData {
  agentId: string;
  agentType: AgentType;
  agentSource: string;
  bookType?: string;
  targetAge?: string;
  characterTheme?: string;
  sessionId?: string;
  additionalMetadata?: Record<string, unknown>;
}

// ============================================
// AGENT SELECTION
// ============================================

/**
 * Selects the appropriate agent based on book type with fallback logic
 * 
 * Priority order:
 * 1. Specialized agent for the book type
 * 2. Generic book-creation agent
 * 3. Inline fallback (if allowed)
 */
export async function selectAgent(
  supabase: SupabaseClient,
  config: OrchestrationConfig = {}
): Promise<AgentSelectionResult> {
  const { bookType, requireAgent = false, minPromptLength = 500 } = config;
  
  console.log('[AgentOrchestration] Starting agent selection', { bookType });
  
  // Get dynamic agent type mapping from database
  const agentTypeMap = await fetchAgentTypeMap(supabase);
  const agentType: AgentType = agentTypeMap[bookType || 'other'] || 'book-creation';
  
  console.log('[AgentOrchestration] Mapped to agent type:', agentType);
  
  // Try specialized agent first (if not generic)
  if (agentType !== 'book-creation') {
    const { data: specialized, error } = await supabase
      .from('agents')
      .select('id, name, type, version, instructions, model, max_completion_tokens, top_p, provider')
      .eq('type', agentType)
      .eq('is_latest', true)
      .maybeSingle();
    
    if (specialized && !error && validateAgent(specialized, minPromptLength)) {
      console.log('[AgentOrchestration] ✓ Using specialized agent:', specialized.name);
      return { agent: specialized, source: 'specialized', agentType };
    }
    
    console.log('[AgentOrchestration] ⚠ Specialized agent not found or invalid, falling back');
  }
  
  // Fallback to generic book-creation agent
  const { data: generic, error: genericError } = await supabase
    .from('agents')
    .select('id, name, type, version, instructions, model, max_completion_tokens, top_p, provider')
    .eq('type', 'book-creation')
    .eq('is_latest', true)
    .maybeSingle();
  
  if (generic && !genericError && validateAgent(generic, minPromptLength)) {
    console.log('[AgentOrchestration] ✓ Using generic agent:', generic.name);
    return { agent: generic, source: 'generic-fallback', agentType };
  }
  
  // No agent found
  if (requireAgent) {
    console.error('[AgentOrchestration] ✗ No agents found and requireAgent=true');
    return { 
      agent: null, 
      source: 'inline-fallback', 
      agentType,
      error: 'No book creation agent configured. Please set up agents in the admin panel.'
    };
  }
  
  console.log('[AgentOrchestration] ⚠ No agent found, using inline fallback');
  return { agent: null, source: 'inline-fallback', agentType };
}

/**
 * Validates an agent configuration meets minimum requirements
 */
function validateAgent(agent: AgentRecord, minPromptLength: number): boolean {
  if (!agent.instructions || agent.instructions.length < minPromptLength) {
    console.warn(`[AgentOrchestration] Agent ${agent.name} has invalid prompt (${agent.instructions?.length || 0} chars)`);
    return false;
  }
  return true;
}

// ============================================
// MODEL SETTINGS
// ============================================

export interface ModelSettings {
  model: string;
  maxCompletionTokens: number;
  topP: number;
}

/**
 * Extracts model settings from agent with safe defaults
 */
export function getModelSettings(
  agent: AgentRecord | null,
  overrides: Partial<ModelSettings> = {}
): ModelSettings {
  const defaults = {
    model: 'google/gemini-2.5-flash',
    maxCompletionTokens: 8000,
    topP: 0.95
  };
  
  return {
    model: overrides.model || agent?.model || defaults.model,
    maxCompletionTokens: overrides.maxCompletionTokens || agent?.max_completion_tokens || defaults.maxCompletionTokens,
    topP: overrides.topP || agent?.top_p || defaults.topP
  };
}

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * Creates a performance metric record for agent usage tracking
 * Returns the metric ID for later updates
 */
export async function createPerformanceMetric(
  supabase: SupabaseClient,
  data: PerformanceMetricData
): Promise<string | null> {
  const { data: result, error } = await supabase
    .from('agent_performance_metrics')
    .insert({
      agent_id: data.agentId,
      agent_type: data.agentType,
      metadata_captured: {
        bookType: data.bookType,
        targetAge: data.targetAge,
        characterTheme: data.characterTheme,
        agentSource: data.agentSource,
        sessionId: data.sessionId,
        ...data.additionalMetadata
      }
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('[AgentOrchestration] Failed to create performance metric:', error.message);
    return null;
  }
  
  console.log('[AgentOrchestration] Created performance metric:', result.id);
  return result.id;
}

/**
 * Updates a performance metric with completion data
 */
export async function completePerformanceMetric(
  supabase: SupabaseClient,
  metricId: string,
  data: {
    bookId?: string;
    bookCreated?: boolean;
    totalPages?: number;
    userEditedPages?: number;
    userSatisfaction?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('agent_performance_metrics')
    .update({
      book_id: data.bookId,
      book_created: data.bookCreated,
      total_pages: data.totalPages,
      user_edited_pages: data.userEditedPages,
      user_satisfaction: data.userSatisfaction,
      completed_at: new Date().toISOString()
    })
    .eq('id', metricId);
  
  if (error) {
    console.error('[AgentOrchestration] Failed to update performance metric:', error.message);
  }
}

// ============================================
// INLINE FALLBACK PROMPTS
// ============================================

/**
 * Returns inline fallback prompt when no agent is configured
 */
export function getInlineFallbackPrompt(bookType?: string): string {
  if (!bookType) {
    return `You are a helpful AI assistant for creating children's educational books. Help users explore different book types: ABC, Numbers, Colors, Shapes, Animals, Rhyming, Emotions, Opposites, First Words, CVC Words, Sight Words, and Bedtime stories. Ask which type interests them.`;
  }
  
  return `You are an AI assistant specializing in creating ${bookType} educational books for children. Guide the user through creating their book step by step.`;
}

// ============================================
// LOGGING UTILITIES
// ============================================

export interface OrchestrationLog {
  agentId?: string;
  agentName?: string;
  agentType: AgentType;
  version?: string;
  source: string;
  promptLength: number;
}

/**
 * Logs orchestration details in a consistent format
 */
export function logOrchestration(log: OrchestrationLog): void {
  console.log('[AgentOrchestration] Agent selected:', {
    agentId: log.agentId || 'N/A',
    agentName: log.agentName || 'Inline Fallback',
    agentType: log.agentType,
    version: log.version || 'N/A',
    source: log.source,
    promptLength: log.promptLength
  });
}
```

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/google-chat/index.ts` | Replace inline agent selection with `selectAgent()` and `getModelSettings()` |
| `supabase/functions/google-create-book/index.ts` | Replace inline orchestration with shared utility calls |

### Example Usage (google-chat refactor)

**Before (current code, ~50 lines):**
```typescript
// Lines 487-632 of google-chat/index.ts
const agentTypeMap = await fetchAgentTypeMap(supabase);
const agentType = agentTypeMap[bookType] || 'book-creation';
const { data: agentData } = await supabase
  .from('agents')
  .select('instructions, name, model, max_completion_tokens, top_p')
  .eq('type', agentType)
  .eq('is_latest', true)
  .single();
// ... more inline logic
```

**After (using shared utility, ~10 lines):**
```typescript
import { selectAgent, getModelSettings, logOrchestration, getInlineFallbackPrompt } from '../_shared/agentOrchestration.ts';

const { agent, source, agentType, error } = await selectAgent(supabase, { bookType });

if (error) {
  return new Response(JSON.stringify({ error }), { status: 500, headers });
}

const modelSettings = getModelSettings(agent);
const systemPrompt = agent?.instructions || getInlineFallbackPrompt(bookType);

logOrchestration({
  agentId: agent?.id,
  agentName: agent?.name,
  agentType,
  version: agent?.version,
  source,
  promptLength: systemPrompt.length
});
```

### Example Usage (google-create-book refactor)

**After:**
```typescript
import { 
  selectAgent, 
  getModelSettings, 
  createPerformanceMetric, 
  completePerformanceMetric,
  logOrchestration 
} from '../_shared/agentOrchestration.ts';

// Agent selection
const { agent, source, agentType, error } = await selectAgent(supabase, { 
  bookType, 
  requireAgent: true,
  minPromptLength: 500 
});

if (error || !agent) {
  return new Response(JSON.stringify({ success: false, error }), { status: 500, headers });
}

// Performance tracking
const metricId = await createPerformanceMetric(supabase, {
  agentId: agent.id,
  agentType,
  agentSource: source,
  bookType,
  targetAge,
  characterTheme,
  sessionId
});

// ... book creation logic ...

// Complete metrics on success
if (metricId && book) {
  await completePerformanceMetric(supabase, metricId, {
    bookId: book.id,
    bookCreated: true,
    totalPages: book.pages.length
  });
}
```

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Agent selection code | ~100 lines × 2 functions | ~50 lines shared |
| Performance tracking | Duplicated, inconsistent | Unified utility |
| Error handling | Function-specific | Standardized |
| Adding new functions | Copy/paste agent logic | Import utility |
| Logging format | Inconsistent | Structured, consistent |

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/agentOrchestration.ts` | Core orchestration utility |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/google-chat/index.ts` | Use `selectAgent()`, `getModelSettings()`, remove inline logic |
| `supabase/functions/google-create-book/index.ts` | Use full orchestration suite including metrics |

## Technical Considerations

1. **Cache Coordination**: The existing `fetchAgentTypeMap()` already has a 1-minute TTL cache. The orchestration utility will leverage this.

2. **Backward Compatibility**: Functions can adopt the utility incrementally—no breaking changes.

3. **Metrics Table**: Uses existing `agent_performance_metrics` table (already in schema).

4. **Fallback Chain**: Clear priority: specialized → generic → inline fallback (with configurable `requireAgent` flag).

5. **Validation**: Configurable minimum prompt length to catch misconfigured agents early.

## Risk Mitigation

1. **Gradual Rollout**: Refactor `google-create-book` first (it has the most complete orchestration), then `google-chat`
2. **Preserve Existing Behavior**: All current logic is captured in utility functions
3. **Detailed Logging**: Consistent `[AgentOrchestration]` prefix for easy debugging
4. **Fallback Safety**: Inline prompts still available when no agents configured
