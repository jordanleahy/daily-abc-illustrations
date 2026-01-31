// Core factory
export { createMutation } from './factory';

// Preset factories for common patterns
export {
  createSoftDeleteMutation,
  createHardDeleteMutation,
  createSimpleCreateMutation,
  createSimpleUpdateMutation,
  createRpcMutation,
} from './presets';

// Types
export type {
  TableName,
  MutationOperation,
  MutationConfig,
  MutationContext,
  ToastConfig,
  OptimisticConfig,
  UpdateInput,
} from './types';
