

# Plan: Database-Driven Agent Type System for True DRY Architecture

## Executive Summary

Currently, `AgentType`, `BOOK_TYPE_TO_AGENT_TYPE`, and `AIProvider` are duplicated in 3+ places with **drift already occurring** (frontend has `dr-seuss`, backend doesn't; database has `song`, neither has it). Rather than just synchronizing copies, we'll leverage the existing `book_types` database table as the **single source of truth** and generate the derived `AgentType` values dynamically.

## Current State Analysis

### Duplication Found

| Definition | Frontend | Backend | Database |
|------------|----------|---------|----------|
| `AgentType` | `src/types/shared/agent.ts` | `supabase/functions/_shared/types.ts` | N/A (derived from agents.type column) |
| `BOOK_TYPE_TO_AGENT_TYPE` | `src/types/shared/agent.ts` | `supabase/functions/_shared/types.ts` | N/A |
| `AIProvider` | `src/types/shared/agent.ts` | `supabase/functions/_shared/types.ts` | N/A |
| `VALID_BOOK_TYPES` | `src/types/bookType.ts` | `supabase/functions/_shared/types.ts` | `book_types` table |

### Type Drift Detected

- **Frontend has** `book-creation-dr-seuss` - Backend missing
- **Database has** `book-creation-song` agent type - Neither frontend nor backend has this
- **Backend missing** `dr-seuss` in `VALID_BOOK_TYPES` 

### Real-time Status

- `useAgentRealtime` exists for agent updates
- `useAgentQuestionsSubscription` exists for question updates  
- **No real-time subscription** for `book_types` changes (5-min stale time cache only)

## Proposed Architecture

### Strategy: Database as Source of Truth

Since `book_types` already exists and is the operational source, we'll:

1. **Add `agent_type_suffix` column** to `book_types` table for explicit mapping
2. **Generate `AgentType` dynamically** from database in edge functions
3. **Keep static fallbacks** for type safety in TypeScript

```text
┌─────────────────────────────────────────────────────────────────┐
│                    book_types (PostgreSQL)                       │
│  id: 'abc' | 'numbers' | 'song' | 'dr-seuss' | ...              │
│  agent_type_suffix: NULL | 'abc' | 'numbers' | 'song' | ...     │
│  → Computes: 'book-creation-' + COALESCE(agent_type_suffix, id) │
└───────────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴───────────────────┐
         ↓                                         ↓
   Frontend (Runtime)                        Backend (Runtime)
   useBookTypes() hook                       fetchBookTypeMap() util
   derives agent mapping                     derives agent mapping
         ↓                                         ↓
   Type-safe union                           Type-safe union
   (static + dynamic)                        (static + dynamic)
```

## Implementation Plan

### Phase 1: Add Database Column for Agent Type Mapping

Add `agent_type_suffix` column to `book_types` to explicitly define the agent type suffix:

```sql
ALTER TABLE book_types 
ADD COLUMN agent_type_suffix TEXT DEFAULT NULL;

COMMENT ON COLUMN book_types.agent_type_suffix IS 
  'Suffix for agent type. Agent type = ''book-creation-'' + COALESCE(agent_type_suffix, id). NULL means use id directly.';

-- Populate for cases where id differs from agent suffix (none currently, but future-proof)
UPDATE book_types SET agent_type_suffix = id WHERE id = id;
```

### Phase 2: Create Shared Type Generation Utilities

**Frontend Utility** (`src/utils/agentTypeUtils.ts`):

```typescript
import type { DatabaseBookType } from '@/hooks/useBookTypes';

// Static fallback types for TypeScript (used before DB loads)
export const STATIC_AGENT_TYPES = [
  'chat',
  'book-creation',
  'book-creation-numbers',
  'book-creation-rhyming',
  // ... all known types for IDE autocomplete
] as const;

export type StaticAgentType = typeof STATIC_AGENT_TYPES[number];

// Dynamic agent type (string for flexibility, validated at runtime)
export type AgentType = StaticAgentType | `book-creation-${string}`;

/**
 * Generates agent type from book type ID
 */
export function bookTypeToAgentType(bookTypeId: string, suffix?: string | null): AgentType {
  if (bookTypeId === 'other' || bookTypeId === 'general') {
    return 'book-creation';
  }
  return `book-creation-${suffix || bookTypeId}` as AgentType;
}

/**
 * Builds BOOK_TYPE_TO_AGENT_TYPE mapping from database records
 */
export function buildAgentTypeMap(bookTypes: DatabaseBookType[]): Record<string, AgentType> {
  const map: Record<string, AgentType> = {
    'other': 'book-creation', // Fallback
  };
  
  for (const bt of bookTypes) {
    map[bt.id] = bookTypeToAgentType(bt.id, bt.agent_type_suffix);
  }
  
  return map;
}
```

**Backend Utility** (`supabase/functions/_shared/agentTypes.ts`):

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// Static types for TypeScript safety
export type AgentType = 
  | 'chat' 
  | 'book-creation'
  | `book-creation-${string}`;

export type AIProvider = 'openai' | 'deepseek' | 'google';

// Cache for book type mappings (refreshed per invocation or with TTL)
let cachedMapping: Record<string, AgentType> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Fetches book type to agent type mapping from database
 */
export async function fetchAgentTypeMap(
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, AgentType>> {
  const now = Date.now();
  
  if (cachedMapping && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedMapping;
  }
  
  const { data, error } = await supabase
    .from('book_types')
    .select('id, agent_type_suffix')
    .eq('is_active', true);
    
  if (error) {
    console.error('[AgentTypes] Failed to fetch from DB, using fallback');
    return FALLBACK_MAPPING;
  }
  
  const mapping: Record<string, AgentType> = {
    'other': 'book-creation',
  };
  
  for (const row of data || []) {
    const suffix = row.agent_type_suffix || row.id;
    mapping[row.id] = `book-creation-${suffix}` as AgentType;
  }
  
  cachedMapping = mapping;
  cacheTimestamp = now;
  
  return mapping;
}

// Fallback for when DB is unreachable
const FALLBACK_MAPPING: Record<string, AgentType> = {
  'numbers': 'book-creation-numbers',
  'rhyming': 'book-creation-rhyming',
  // ... minimal fallback set
  'other': 'book-creation',
};
```

### Phase 3: Update Frontend Consumption

**Update `src/types/shared/agent.ts`**:

```typescript
// Import dynamic utilities
export { 
  type AgentType, 
  type StaticAgentType,
  bookTypeToAgentType,
  buildAgentTypeMap 
} from '@/utils/agentTypeUtils';

// Keep AIProvider as simple enum (no database backing needed)
export type AIProvider = 'openai' | 'deepseek' | 'google';

// Re-export for backward compatibility 
// (deprecated - prefer buildAgentTypeMap from hook)
export const BOOK_TYPE_TO_AGENT_TYPE = {
  'numbers': 'book-creation-numbers',
  // ... static fallback for SSR/initial render
} as const;
```

**Enhance `useBookTypes` hook**:

```typescript
export function useBookTypes() {
  const query = useQuery({...});
  
  const bookTypes = query.data?.map(toBookType) ?? BOOK_TYPES;
  
  // Generate agent type mapping from database
  const agentTypeMap = useMemo(() => 
    query.data ? buildAgentTypeMap(query.data) : STATIC_BOOK_TYPE_TO_AGENT_TYPE,
    [query.data]
  );
  
  return {
    ...query,
    bookTypes,
    agentTypeMap,  // NEW: Dynamic mapping
    getAgentType: (bookTypeId: string) => agentTypeMap[bookTypeId] || 'book-creation',
  };
}
```

### Phase 4: Update Backend Edge Functions

**Update `google-chat/index.ts`**:

```typescript
// Before (static import)
import { BOOK_TYPE_TO_AGENT_TYPE } from '../_shared/types.ts';
const agentType = BOOK_TYPE_TO_AGENT_TYPE[bookType] || 'book-creation';

// After (dynamic fetch)
import { fetchAgentTypeMap } from '../_shared/agentTypes.ts';
const agentTypeMap = await fetchAgentTypeMap(supabase);
const agentType = agentTypeMap[bookType] || 'book-creation';
```

**Update `google-create-book/index.ts`** similarly.

### Phase 5: Add Real-time Subscription for Book Types

Create `src/hooks/useBookTypesSubscription.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useBookTypesSubscription = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel('book-types-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_types',
        },
        () => {
          // Invalidate cache on any change
          queryClient.invalidateQueries({ queryKey: ['book-types'] });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);
};
```

### Phase 6: Consolidate AIProvider

`AIProvider` is simple and stable - consolidate to single definition:

**Frontend** (`src/types/shared/agent.ts`):
```typescript
export type AIProvider = 'openai' | 'deepseek' | 'google';
```

**Backend** (`supabase/functions/_shared/agentTypes.ts`):
```typescript
export type AIProvider = 'openai' | 'deepseek' | 'google';
```

Add sync comment headers to both files.

## Files to Modify

| File | Change |
|------|--------|
| `book_types` table | Add `agent_type_suffix` column |
| `src/utils/agentTypeUtils.ts` | **NEW** - Dynamic agent type utilities |
| `supabase/functions/_shared/agentTypes.ts` | **NEW** - Backend agent type utilities with caching |
| `src/types/shared/agent.ts` | Simplify to re-exports + AIProvider |
| `src/types/agent.ts` | Update imports |
| `supabase/functions/_shared/types.ts` | Remove AgentType, BOOK_TYPE_TO_AGENT_TYPE (move to agentTypes.ts) |
| `src/hooks/useBookTypes.ts` | Add `agentTypeMap` and `getAgentType` |
| `src/hooks/useBookTypesSubscription.ts` | **NEW** - Real-time sync for book types |
| `supabase/functions/google-chat/index.ts` | Use `fetchAgentTypeMap()` |
| `supabase/functions/google-create-book/index.ts` | Use `fetchAgentTypeMap()` |

## Benefits

1. **True Single Source of Truth**: Database `book_types` table defines all book types
2. **Automatic Sync**: Adding a new book type in admin UI automatically creates the agent type mapping
3. **No Manual Sync Required**: Eliminates the `dr-seuss`/`song` drift issues
4. **Real-time Updates**: Changes propagate immediately via subscriptions
5. **Type Safety Preserved**: Static types remain for IDE autocomplete, runtime validates against DB
6. **Backward Compatible**: Fallback mappings ensure system works during DB failures

## Risk Mitigation

1. **Fallback Static Mapping**: Edge functions have hardcoded fallback if DB fetch fails
2. **Caching**: 1-minute TTL cache prevents excessive DB queries in edge functions
3. **Graceful Degradation**: Frontend falls back to static `BOOK_TYPES` during loading
4. **Migration Safety**: `agent_type_suffix` defaults to NULL (uses `id`), no data loss

## Code Reduction Summary

- Remove ~50 lines of duplicate `AgentType` definitions
- Remove ~40 lines of duplicate `BOOK_TYPE_TO_AGENT_TYPE` mappings  
- Eliminate manual sync overhead between 3 files
- Add ~80 lines of dynamic utilities (net reduction + better architecture)

