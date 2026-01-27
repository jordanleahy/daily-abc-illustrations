
# Real-Time Subscription for Agent Questions

## Overview
Currently, the `agent_questions` table lacks a Supabase Realtime subscription. Changes made in one browser tab (or by another admin) won't reflect immediately in the UI - they require a manual refresh or waiting for the 2-minute cache `staleTime` to expire.

This plan adds a dedicated real-time subscription hook that automatically syncs UI state when discovery questions are toggled, reordered, or modified.

---

## Implementation Approach

### 1. Create New Hook: `useAgentQuestionsSubscription.ts`

Create a new file following the established pattern (similar to `useDailyPublishedSubscription.ts`):

```text
src/hooks/useAgentQuestionsSubscription.ts
```

**Functionality:**
- Subscribe to `postgres_changes` on the `agent_questions` table
- Filter by specific `agent_type` when provided (scoped updates)
- Invalidate the `['agent-questions', agentType]` query cache on any change
- Clean up channel on unmount

### 2. Hook Design

**Parameters:**
- `agentType` (optional): When provided, only listen for changes to that specific agent's questions

**Behavior:**
- If `agentType` is provided: Filter subscription with `agent_type=eq.{agentType}`
- If no `agentType`: Listen to all `agent_questions` changes (for global admin views)
- On any change (INSERT/UPDATE/DELETE): Invalidate the relevant TanStack Query cache

### 3. Integration Points

The hook will be consumed in:
- `AgentQuestionsManager` component (embedded in agent detail pages)
- `BookAgentsManager` component (for book type → agent mappings)
- `AgentDetail` page

---

## Technical Details

### New File: `src/hooks/useAgentQuestionsSubscription.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time subscription for agent_questions table changes
 * Automatically invalidates queries when questions are toggled or reordered
 */
export const useAgentQuestionsSubscription = (agentType?: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = agentType 
      ? `agent-questions-${agentType}` 
      : 'agent-questions-all';
    
    const filter = agentType 
      ? { filter: `agent_type=eq.${agentType}` }
      : {};

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_questions',
          ...filter
        },
        (payload) => {
          console.log('📡 Agent questions changed:', payload);
          
          // Invalidate specific agent query if we know which one changed
          const changedAgentType = 
            (payload.new as any)?.agent_type || 
            (payload.old as any)?.agent_type;
          
          if (changedAgentType) {
            queryClient.invalidateQueries({ 
              queryKey: ['agent-questions', changedAgentType] 
            });
          }
          
          // Also invalidate the global questions registry
          queryClient.invalidateQueries({ queryKey: ['questions'] });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [agentType, queryClient]);
};
```

### Update: `AgentQuestionsManager.tsx`

Add the subscription hook to the component:

```typescript
import { useAgentQuestionsSubscription } from '@/hooks/useAgentQuestionsSubscription';

export function AgentQuestionsManager({ agentType, ... }) {
  // Existing hooks...
  
  // Add real-time subscription
  useAgentQuestionsSubscription(agentType);
  
  // Rest of component...
}
```

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Browser Tab A                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AgentQuestionsManager                                   │    │
│  │    └─> useAgentQuestionsSubscription('opposites')       │    │
│  │           └─> supabase.channel('agent-questions-...')   │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ postgres_changes
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Supabase Realtime                               │
│                                                                  │
│   agent_questions table                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ UPDATE: is_enabled = false → true                        │   │
│   │         agent_type = 'book-creation-opposites'          │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ broadcast
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Browser Tab B                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AgentQuestionsManager                                   │    │
│  │    └─> Receives payload → invalidateQueries()           │    │
│  │           └─> UI refreshes automatically                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useAgentQuestionsSubscription.ts` | Create new file |
| `src/components/agents/AgentQuestionsManager.tsx` | Add hook import and usage |

---

## Benefits

1. **Immediate sync across tabs**: Changes in one admin tab reflect instantly in others
2. **Multi-user collaboration**: If another admin toggles questions, your view updates
3. **Consistent with existing patterns**: Follows the same architecture as 25+ other subscription hooks in the codebase
4. **Minimal overhead**: Only subscribes to relevant agent type changes, not all table activity
