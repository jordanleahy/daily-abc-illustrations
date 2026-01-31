import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { MutationConfig, MutationContext, UpdateInput } from './types';

// Type-safe any cast to avoid Supabase's excessively deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Factory function to create standardized mutation hooks.
 * Reduces boilerplate for common CRUD operations.
 *
 * @example
 * // Simple soft delete
 * export const useDeleteTrick = createMutation<string>({
 *   table: 'tricks',
 *   operation: 'softDelete',
 *   requireAuth: true,
 *   ownerColumn: 'parent_user_id',
 *   invalidateKeys: [queryKeys.tricks.all],
 *   toast: { success: { title: 'Trick deleted' } },
 * });
 *
 * @example
 * // Create with custom logic
 * export const useCreateProduct = createMutation<CreateInput, Product>({
 *   operation: 'create',
 *   invalidateKeys: [queryKeys.products.all],
 *   customMutationFn: async (input, userId) => {
 *     // Custom validation or multi-step creation
 *   },
 * });
 */
export function createMutation<TInput, TOutput = void>(
  config: MutationConfig<TInput, TOutput>
) {
  return function useMutationHook() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation<TOutput, Error, TInput, MutationContext>({
      mutationFn: async (input: TInput): Promise<TOutput> => {
        // Auth check
        if (config.requireAuth && !user?.id) {
          throw new Error('User not authenticated');
        }

        // Custom mutation function takes priority
        if (config.customMutationFn) {
          return config.customMutationFn(input, user?.id);
        }

        const tableName = config.table;
        const userId = user?.id;
        const ownerColumn = config.ownerColumn;

        // Standard operations require a table
        if (!tableName && config.operation !== 'rpc') {
          throw new Error('Table name required for standard operations');
        }

        // Handle standard operations
        // We use 'any' casts here to work around Supabase's deep type instantiation issues
        // The runtime behavior is correct; this is purely a TypeScript limitation
        switch (config.operation) {
          case 'softDelete': {
            const id = input as unknown as string;
            let query = db.from(tableName!)
              .update({ is_active: false })
              .eq('id', id);

            if (ownerColumn && userId) {
              query = query.eq(ownerColumn, userId);
            }

            const { error } = await query;
            if (error) throw error;
            return undefined as TOutput;
          }

          case 'delete': {
            const id = input as unknown as string;
            const { error } = await db.from(tableName!)
              .delete()
              .eq('id', id);

            if (error) throw error;
            return undefined as TOutput;
          }

          case 'create': {
            const insertData = ownerColumn && userId
              ? { ...(input as object), [ownerColumn]: userId }
              : input;

            const { data, error } = await db.from(tableName!)
              .insert(insertData)
              .select()
              .single();

            if (error) throw error;
            return data as TOutput;
          }

          case 'update': {
            const { id, updates } = input as unknown as UpdateInput<unknown>;
            let query = db.from(tableName!)
              .update(updates)
              .eq('id', id);

            if (ownerColumn && userId) {
              query = query.eq(ownerColumn, userId);
            }

            const { data, error } = await query.select().single();
            if (error) throw error;
            return data as TOutput;
          }

          case 'rpc': {
            if (!config.rpcName) {
              throw new Error('RPC name required for rpc operation');
            }
            const { data, error } = await db.rpc(
              config.rpcName,
              input as Record<string, unknown>
            );
            if (error) throw error;
            return data as TOutput;
          }

          default:
            throw new Error(`Unsupported operation: ${config.operation}`);
        }
      },

      // Optimistic updates
      onMutate: config.optimistic
        ? async (input: TInput): Promise<MutationContext> => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: [...config.optimistic!.queryKey] });

            // Snapshot the previous value
            const previous = queryClient.getQueryData([...config.optimistic!.queryKey]);

            // Optimistically update
            queryClient.setQueryData(
              [...config.optimistic!.queryKey],
              (old: unknown) => config.optimistic!.update(old, input)
            );

            return { previous };
          }
        : undefined,

      onError: (error: Error, _input: TInput, context?: MutationContext) => {
        // Rollback optimistic update if configured
        if (config.optimistic?.rollback && context?.previous !== undefined) {
          queryClient.setQueryData([...config.optimistic.queryKey], context.previous);
        }

        // Show error toast
        const title = config.toast?.error?.title || 'Error';
        const description = config.toast?.error?.description || error.message;
        toast.error(title, { description });

        // Also log to console for debugging
        console.error(`[Mutation Error] ${title}:`, error);
      },

      onSuccess: (data: TOutput) => {
        // Invalidate all specified query keys
        config.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [...key] });
        });

        // Show success toast if configured
        if (config.toast?.success) {
          const description =
            typeof config.toast.success.description === 'function'
              ? config.toast.success.description(data)
              : config.toast.success.description;

          toast.success(config.toast.success.title, { description });
        }
      },
    });
  };
}
