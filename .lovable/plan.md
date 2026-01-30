# Plan: Database-Driven Agent Type System for True DRY Architecture

## Status: ✅ IMPLEMENTED

## Summary

Consolidated `AgentType`, `BOOK_TYPE_TO_AGENT_TYPE`, and `AIProvider` definitions using the `book_types` database table as the single source of truth. The system now dynamically generates agent type mappings from the database with 1-minute caching in edge functions and real-time subscriptions on the frontend.

## Changes Made

### Database
- Added `agent_type_suffix` column to `book_types` table for explicit agent type mapping

### Frontend (src/)
- **NEW**: `src/utils/agentTypeUtils.ts` - Dynamic agent type generation utilities
- **NEW**: `src/hooks/useBookTypesSubscription.ts` - Real-time subscription for book_types changes
- **UPDATED**: `src/hooks/useBookTypes.ts` - Added `agentTypeMap` and `getAgentType()` helpers
- **UPDATED**: `src/types/shared/agent.ts` - Re-exports from agentTypeUtils, deprecated static mapping
- **UPDATED**: `src/types/agent.ts` - Updated imports

### Backend (supabase/functions/)
- **NEW**: `supabase/functions/_shared/agentTypes.ts` - Dynamic agent type utilities with 1-min TTL cache
- **UPDATED**: `supabase/functions/_shared/types.ts` - Re-exports from agentTypes.ts, deprecated static mapping
- **UPDATED**: `supabase/functions/google-chat/index.ts` - Uses `fetchAgentTypeMap()`
- **UPDATED**: `supabase/functions/google-create-book/index.ts` - Uses `fetchAgentTypeMap()`

## Architecture

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
   useBookTypes() hook                       fetchAgentTypeMap() util
   derives agent mapping                     derives agent mapping
   + real-time subscription                  + 1-min TTL cache
         ↓                                         ↓
   Type-safe union                           Type-safe union
   (static + dynamic)                        (static + dynamic)
```

## Benefits Achieved

1. **True Single Source of Truth**: Database `book_types` table defines all book types
2. **Automatic Sync**: Adding a new book type in admin UI automatically creates the agent type mapping
3. **No Manual Sync Required**: Eliminates the `dr-seuss`/`song` drift issues
4. **Real-time Updates**: Changes propagate immediately via subscriptions
5. **Type Safety Preserved**: Static types remain for IDE autocomplete, runtime validates against DB
6. **Backward Compatible**: Fallback mappings ensure system works during DB failures

## Code Reduction

- Removed ~50 lines of duplicate `AgentType` definitions
- Removed ~40 lines of duplicate `BOOK_TYPE_TO_AGENT_TYPE` mappings
- Eliminated manual sync overhead between 3 files
- Added ~150 lines of dynamic utilities (net architecture improvement)
