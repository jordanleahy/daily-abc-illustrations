// Table name as string - we use 'any' casting in factory to avoid deep type instantiation
export type TableName = string;

// Operation types the factory supports
export type MutationOperation = 'create' | 'update' | 'delete' | 'softDelete' | 'rpc';

// Toast configuration
export interface ToastConfig<TOutput = unknown> {
  success?: {
    title: string;
    description?: string | ((data: TOutput) => string);
  };
  error?: {
    title: string;
    description?: string;
  };
}

// Optimistic update configuration
export interface OptimisticConfig<TInput> {
  queryKey: readonly unknown[];
  update: (old: unknown, input: TInput) => unknown;
  rollback?: boolean;
}

// Input for update operations - requires id and partial updates
export interface UpdateInput<T> {
  id: string;
  updates: Partial<T>;
}

// Configuration for a mutation
export interface MutationConfig<TInput, TOutput = unknown> {
  // Core operation
  table?: TableName;
  operation: MutationOperation;

  // For RPC operations
  rpcName?: string;

  // Query key management - supports both readonly tuples and mutable arrays
  invalidateKeys: (readonly unknown[] | unknown[])[];

  // Toast notifications
  toast?: ToastConfig<TOutput>;

  // Require authentication
  requireAuth?: boolean;

  // Owner filter column (for operations that need user ownership check)
  ownerColumn?: string;

  // Custom mutation function (for complex cases)
  customMutationFn?: (input: TInput, userId?: string) => Promise<TOutput>;

  // Optimistic update configuration
  optimistic?: OptimisticConfig<TInput>;
}

// Context returned from onMutate for rollback
export interface MutationContext {
  previous?: unknown;
}
