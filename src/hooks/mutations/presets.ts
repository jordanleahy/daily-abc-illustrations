import { createMutation } from './factory';
import type { TableName, MutationConfig, UpdateInput } from './types';

/**
 * Pre-configured factory for soft delete operations.
 * Sets is_active = false instead of actually deleting.
 *
 * @example
 * export const useDeleteTrick = createSoftDeleteMutation(
 *   'tricks',
 *   [queryKeys.tricks.all, queryKeys.tricks.goals],
 *   'Trick',
 *   'parent_user_id'
 * );
 */
export function createSoftDeleteMutation(
  table: TableName,
  invalidateKeys: (readonly unknown[])[],
  entityName: string,
  ownerColumn?: string
) {
  return createMutation<string>({
    table,
    operation: 'softDelete',
    requireAuth: !!ownerColumn,
    ownerColumn,
    invalidateKeys,
    toast: {
      success: { title: `${entityName} deleted` },
      error: { title: `Failed to delete ${entityName.toLowerCase()}` },
    },
  });
}

/**
 * Pre-configured factory for hard delete operations.
 * Actually removes the record from the database.
 *
 * @example
 * export const useDeletePage = createHardDeleteMutation(
 *   'pages',
 *   [queryKeys.pages.all],
 *   'Page'
 * );
 */
export function createHardDeleteMutation(
  table: TableName,
  invalidateKeys: (readonly unknown[])[],
  entityName: string
) {
  return createMutation<string>({
    table,
    operation: 'delete',
    invalidateKeys,
    toast: {
      success: {
        title: `${entityName} Deleted`,
        description: `The ${entityName.toLowerCase()} has been permanently deleted.`,
      },
      error: { title: `Failed to delete ${entityName.toLowerCase()}` },
    },
  });
}

/**
 * Pre-configured factory for simple create operations.
 *
 * @example
 * export const useCreateProduct = createSimpleCreateMutation<CreateInput, Product>(
 *   'kid_rewards_products',
 *   [queryKeys.rewards.products],
 *   'Product',
 *   'parent_user_id'
 * );
 */
export function createSimpleCreateMutation<TInput extends object, TOutput = unknown>(
  table: TableName,
  invalidateKeys: (readonly unknown[])[],
  entityName: string,
  ownerColumn?: string
) {
  return createMutation<TInput, TOutput>({
    table,
    operation: 'create',
    requireAuth: !!ownerColumn,
    ownerColumn,
    invalidateKeys,
    toast: {
      success: { title: 'Success', description: `${entityName} created successfully` },
      error: { title: 'Error', description: `Failed to create ${entityName.toLowerCase()}` },
    },
  });
}

/**
 * Pre-configured factory for simple update operations.
 *
 * @example
 * export const useUpdateProfile = createSimpleUpdateMutation<ProfileUpdates, Profile>(
 *   'profiles',
 *   [queryKeys.profile],
 *   'Profile'
 * );
 */
export function createSimpleUpdateMutation<TUpdates, TOutput = unknown>(
  table: TableName,
  invalidateKeys: (readonly unknown[])[],
  entityName: string,
  ownerColumn?: string
) {
  return createMutation<UpdateInput<TUpdates>, TOutput>({
    table,
    operation: 'update',
    requireAuth: !!ownerColumn,
    ownerColumn,
    invalidateKeys,
    toast: {
      success: { title: 'Success', description: `${entityName} updated successfully` },
      error: { title: 'Error', description: `Failed to update ${entityName.toLowerCase()}` },
    },
  });
}

/**
 * Pre-configured factory for RPC-based mutations.
 *
 * @example
 * export const useArchiveBook = createRpcMutation<ArchiveInput, boolean>(
 *   'archive_book',
 *   [queryKeys.books.all],
 *   'Book archived'
 * );
 */
export function createRpcMutation<TInput, TOutput = unknown>(
  rpcName: string,
  invalidateKeys: (readonly unknown[])[],
  successMessage: string
) {
  return createMutation<TInput, TOutput>({
    operation: 'rpc',
    rpcName,
    invalidateKeys,
    toast: {
      success: { title: successMessage },
      error: { title: 'Operation failed' },
    },
  });
}
