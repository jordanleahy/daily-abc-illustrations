
# CRUD Mutation Factory Consolidation Plan

## Executive Summary
Create a centralized mutation factory system to eliminate repetitive boilerplate across ~30+ mutation hooks. This will reduce code duplication by approximately 60-70%, standardize toast notifications, and centralize query key management.

---

## Current State Analysis

### Pattern Categories Identified

| Category | Count | Example Hooks |
|----------|-------|---------------|
| **Simple Delete (soft)** | ~10 | `useDeleteHabit`, `useDeleteTrick`, `useDeleteCity`, `useDeleteRewardsProduct` |
| **Simple Delete (hard)** | ~5 | `useDeleteBook`, `useDeletePage`, `useDeleteDailyPublished` |
| **Simple Create** | ~8 | `useCreateTrick`, `useCreateHabit`, `useCreateRewardsProduct` |
| **Simple Update** | ~7 | `useUpdateHabit`, `useUpdateProfile`, `useUpdateRewardsProduct`, `useUpdateTrick` |
| **Complex with Optimistic Updates** | ~5 | `useDeleteBook`, `useArchiveBook`, `useBulkDeleteBooks` |
| **RPC-based Mutations** | ~4 | `useArchiveBook`, `useSkipHabit`, `useDeleteHabitCompletion` |

### Common Boilerplate (repeated in every hook)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast'; // or sonner

return useMutation({
  mutationFn: async (...) => { ... },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [...] });
    toast({ title: '...', description: '...' });
  },
  onError: (error) => {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  },
});
```

### Pain Points
1. **Mixed toast libraries**: Some hooks use `@/hooks/use-toast` (shadcn), others use `sonner`
2. **Scattered query keys**: Hardcoded strings everywhere, not using `queryKeys.ts`
3. **Inconsistent error handling**: Some log, some show toast, some do both
4. **Duplicated auth checks**: Many hooks repeat `if (!user?.id) throw new Error('...')`

---

## Proposed Architecture

### New File Structure
```text
src/
├── hooks/
│   ├── mutations/
│   │   ├── factory.ts           # Core factory function
│   │   ├── types.ts             # Factory type definitions
│   │   ├── presets.ts           # Common operation presets
│   │   └── index.ts             # Re-exports
│   ├── queryKeys.ts             # Extended centralized query keys
│   └── use-toast.ts             # (existing)
```

---

## Technical Design

### 1. Factory Types (`src/hooks/mutations/types.ts`)

```typescript
import { Tables } from '@/integrations/supabase/types';

// Supported table names from the Supabase schema
type TableName = keyof Tables;

// Operation types the factory supports
type MutationOperation = 'create' | 'update' | 'delete' | 'softDelete' | 'rpc';

// Configuration for a mutation
interface MutationConfig<TInput, TOutput = unknown> {
  // Core operation
  table?: TableName;
  operation: MutationOperation;
  
  // For RPC operations
  rpcName?: string;
  
  // Query key management
  invalidateKeys: string[][];
  
  // Toast notifications
  toast?: {
    success?: { title: string; description?: string | ((data: TOutput) => string) };
    error?: { title: string; description?: string };
  };
  
  // Require authentication
  requireAuth?: boolean;
  
  // Custom mutation function (for complex cases)
  customMutationFn?: (input: TInput, userId?: string) => Promise<TOutput>;
  
  // Optimistic update configuration
  optimistic?: {
    queryKey: string[];
    update: (old: unknown, input: TInput) => unknown;
    rollback?: boolean;
  };
}
```

### 2. Core Factory Function (`src/hooks/mutations/factory.ts`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner'; // Standardize on sonner
import { MutationConfig } from './types';

export function createMutation<TInput, TOutput = unknown>(
  config: MutationConfig<TInput, TOutput>
) {
  return function useMutationHook() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation({
      mutationFn: async (input: TInput): Promise<TOutput> => {
        // Auth check
        if (config.requireAuth && !user?.id) {
          throw new Error('User not authenticated');
        }

        // Custom mutation function
        if (config.customMutationFn) {
          return config.customMutationFn(input, user?.id);
        }

        // Standard operations
        switch (config.operation) {
          case 'softDelete':
            return handleSoftDelete(config.table!, input);
          case 'delete':
            return handleHardDelete(config.table!, input);
          case 'create':
            return handleCreate(config.table!, input, user?.id);
          case 'update':
            return handleUpdate(config.table!, input);
          case 'rpc':
            return handleRpc(config.rpcName!, input);
          default:
            throw new Error(`Unsupported operation: ${config.operation}`);
        }
      },

      onMutate: config.optimistic
        ? async (input) => {
            await queryClient.cancelQueries({ queryKey: config.optimistic!.queryKey });
            const previous = queryClient.getQueryData(config.optimistic!.queryKey);
            queryClient.setQueryData(
              config.optimistic!.queryKey,
              (old: unknown) => config.optimistic!.update(old, input)
            );
            return { previous };
          }
        : undefined,

      onError: (error, _, context) => {
        // Rollback optimistic update
        if (config.optimistic?.rollback && context?.previous) {
          queryClient.setQueryData(config.optimistic.queryKey, context.previous);
        }

        const title = config.toast?.error?.title || 'Error';
        const description = config.toast?.error?.description || error.message;
        toast.error(title, { description });
      },

      onSuccess: (data) => {
        // Invalidate queries
        config.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });

        // Show success toast
        if (config.toast?.success) {
          const description = typeof config.toast.success.description === 'function'
            ? config.toast.success.description(data)
            : config.toast.success.description;
          toast.success(config.toast.success.title, { description });
        }
      },
    });
  };
}
```

### 3. Common Presets (`src/hooks/mutations/presets.ts`)

```typescript
// Pre-configured factory for common patterns

export const softDeletePreset = <TInput extends string>(
  table: string,
  invalidateKeys: string[][],
  entityName: string
) =>
  createMutation<TInput>({
    table,
    operation: 'softDelete',
    invalidateKeys,
    toast: {
      success: { title: 'Deleted', description: `${entityName} removed successfully` },
      error: { title: 'Delete failed', description: `Failed to remove ${entityName}` },
    },
  });
```

### 4. Extended Query Keys (`src/hooks/queryKeys.ts`)

```typescript
export const queryKeys = {
  // Existing
  library: {
    books: ['library-books'] as const,
    bookById: (bookId: string) => ['library-book', bookId] as const,
    bookPages: (bookId: string) => ['library-book-pages', bookId] as const,
  },
  pages: {
    byBook: (bookId: string) => ['book-pages', bookId] as const,
  },

  // New additions
  books: {
    all: ['books'] as const,
    byId: (id: string) => ['book', id] as const,
    publicationStatus: ['book-publication-status'] as const,
  },
  habits: {
    all: ['habits'] as const,
    today: ['today-habits'] as const,
    schedule: ['habit-schedule'] as const,
    isBookHabit: ['is-book-habit'] as const,
    my: ['my-habits'] as const,
  },
  tricks: {
    all: ['tricks'] as const,
    goals: ['trick-goals'] as const,
  },
  kidProfiles: {
    all: ['kid-profiles'] as const,
    byUser: (userId: string) => ['kid-profiles', userId] as const,
    coins: ['kid-coins'] as const,
  },
  rewards: {
    products: ['rewards-products'] as const,
    purchases: ['kid-purchases'] as const,
  },
  dailyPublished: {
    all: ['daily-published'] as const,
    queue: ['daily-published-queue'] as const,
    schedule: ['daily-published-schedule'] as const,
    active: ['active-daily-published'] as const,
  },
  cities: {
    all: ['cities'] as const,
    landmarks: ['city-landmarks'] as const,
    options: ['question-options'] as const,
  },
} as const;
```

---

## Migration Examples

### Before: `useDeleteTrick.ts` (28 lines)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useDeleteTrick() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trickId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('tricks')
        .update({ is_active: false })
        .eq('id', trickId)
        .eq('parent_user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tricks'] });
      queryClient.invalidateQueries({ queryKey: ['trick-goals'] });
      toast.success('Trick deleted');
    },
    onError: (error) => {
      console.error('Failed to delete trick:', error);
      toast.error('Failed to delete trick');
    },
  });
}
```

### After: Using Factory (8 lines)
```typescript
import { createMutation } from './mutations/factory';
import { queryKeys } from './queryKeys';

export const useDeleteTrick = createMutation<string>({
  table: 'tricks',
  operation: 'softDelete',
  requireAuth: true,
  invalidateKeys: [queryKeys.tricks.all, queryKeys.tricks.goals],
  toast: {
    success: { title: 'Trick deleted' },
    error: { title: 'Failed to delete trick' },
  },
});
```

### Before: `useDeleteRewardsProduct.ts` (32 lines)
Full hook with system product check...

### After: Using Custom Function (12 lines)
```typescript
export const useDeleteRewardsProduct = createMutation<RewardsProduct>({
  operation: 'softDelete',
  invalidateKeys: [queryKeys.rewards.products],
  customMutationFn: async (product) => {
    if (product.is_system_product) {
      throw new Error('System products cannot be deleted');
    }
    const { error } = await supabase
      .from('kid_rewards_products')
      .update({ is_active: false })
      .eq('id', product.id);
    if (error) throw error;
  },
  toast: {
    success: { title: 'Success', description: 'Product removed successfully' },
  },
});
```

---

## Implementation Phases

### Phase 1: Foundation (Est. 1 session)
1. Create `src/hooks/mutations/types.ts` with type definitions
2. Create `src/hooks/mutations/factory.ts` with core factory
3. Create `src/hooks/mutations/presets.ts` with common patterns
4. Extend `queryKeys.ts` with all missing query keys

### Phase 2: Simple Deletions (Est. 1 session)
Migrate these hooks to use factory:
- `useDeleteTrick`
- `useDeleteCity`
- `useDeleteRewardsProduct`
- `useDeleteKidProfile`
- `useDeleteHabit`

### Phase 3: Create/Update Hooks (Est. 1 session)
Migrate:
- `useCreateRewardsProduct`
- `useUpdateRewardsProduct`
- `useUpdateProfile`
- `useUpdateHabit`
- `useCreateTrick`

### Phase 4: Complex Hooks (Est. 1 session)
Handle hooks with optimistic updates:
- `useDeleteBook` (optimistic + redirect)
- `useArchiveBook` (optimistic + RPC)
- `useBulkDeleteBooks` (batch processing)

### Phase 5: Toast Standardization (Est. 1 session)
- Migrate all remaining hooks to use `sonner`
- Remove mixed usage of `use-toast` vs `sonner`

---

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Lines of code (mutation hooks) | ~1,200 | ~400 |
| Files | ~30 | ~20 (some consolidated) |
| Toast library usage | Mixed (2 libraries) | Unified (sonner) |
| Query key management | Scattered strings | Centralized `queryKeys` |
| Adding a new CRUD hook | ~30-50 lines | ~8-15 lines |

---

## Hooks to Keep Separate

Some hooks are too complex for the factory pattern and should remain standalone:
- `useMarkHabitComplete` - Complex optimistic updates with coin logic
- `useSkipHabit` - Multi-table RPC with optimistic rollback
- `useCreateHabit` - Creates multiple related records
- `useScheduleBookPublication` - Fire-and-forget side effects

---

## Risk Mitigation

1. **Gradual migration**: Migrate one category at a time, verify each works
2. **Keep originals temporarily**: Comment out old hooks, don't delete immediately
3. **Test coverage**: Add unit tests for factory before migration
4. **Type safety**: Factory is fully typed, compile-time errors catch issues

