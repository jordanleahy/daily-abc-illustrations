
# Real-Time Subscription for Questions Registry

## Overview
Add a dedicated Supabase Realtime subscription for the `questions` table to ensure that when questions are created, updated, or deleted, all admin browser tabs reflect the changes instantly.

---

## Implementation Approach

### 1. Create New Hook: `useQuestionsSubscription.ts`

A lightweight subscription hook that listens to changes on the `questions` table and invalidates the TanStack Query cache.

**File:** `src/hooks/useQuestionsSubscription.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time subscription for questions registry table changes
 * Automatically invalidates queries when questions are created, updated, or deleted
 */
export const useQuestionsSubscription = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel('questions-registry')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
        },
        (payload) => {
          console.log('📡 Questions registry changed:', payload);
          
          // Invalidate the global questions list
          queryClient.invalidateQueries({ queryKey: ['questions'] });
          
          // If we know which question changed, also invalidate its detail query
          const changedId = 
            (payload.new as any)?.id || 
            (payload.old as any)?.id;
          
          if (changedId) {
            queryClient.invalidateQueries({ 
              queryKey: ['question', changedId] 
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
};
```

---

### 2. Integration Points

Add the subscription hook to these pages:

| Page | Purpose |
|------|---------|
| `src/pages/QuestionsRegistry.tsx` | Main list of all questions |
| `src/pages/QuestionDetail.tsx` | Individual question detail view |

---

### 3. Code Changes

**QuestionsRegistry.tsx** - Add subscription near the top of the component:
```typescript
import { useQuestionsSubscription } from '@/hooks/useQuestionsSubscription';

const QuestionsRegistry = () => {
  const navigate = useNavigate();
  const { data: questions, isLoading } = useQuestions();
  
  // Real-time sync across admin tabs
  useQuestionsSubscription();
  
  // ... rest of component
};
```

**QuestionDetail.tsx** - Same pattern:
```typescript
import { useQuestionsSubscription } from '@/hooks/useQuestionsSubscription';

const QuestionDetail = () => {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  
  // Real-time sync across admin tabs
  useQuestionsSubscription();
  
  // ... rest of component
};
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useQuestionsSubscription.ts` | Create new file |
| `src/pages/QuestionsRegistry.tsx` | Add hook import and usage |
| `src/pages/QuestionDetail.tsx` | Add hook import and usage |

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Tab A                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  QuestionsRegistry                                       │    │
│  │    └─> useQuestionsSubscription()                       │    │
│  │           └─> supabase.channel('questions-registry')    │    │
│  │                                                          │    │
│  │  [Creates new question "ski_resort"]                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ INSERT event
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Supabase Realtime                               │
│                                                                  │
│   questions table                                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ INSERT: id = 'ski_resort', label = 'Ski Resort'          │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ broadcast to all subscribers
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Tab B                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  QuestionsRegistry                                       │    │
│  │    └─> Receives INSERT payload                          │    │
│  │           └─> invalidateQueries(['questions'])          │    │
│  │                  └─> UI refreshes, shows new question   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Benefits

1. **Instant sync across tabs**: Create/edit/delete a question in one tab, see it immediately in others
2. **Consistent pattern**: Follows the same architecture as `useAgentQuestionsSubscription`
3. **Minimal overhead**: Single channel subscription per page
4. **Detail page awareness**: Also invalidates individual question queries when a specific question changes
