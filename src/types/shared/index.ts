/**
 * Shared types and utilities export barrel
 * Central location for all shared type definitions
 */

// Status enums
export {
  ProcessStatus,
  PublicationStatus,
  GenerationStatus,
  AgentStatus,
  OptimizationStatus
} from './status';

// Base interfaces and utilities
export type {
  BaseComponentProps,
  InteractiveProps,
  FormProps,
  ModalProps,
  VersionTracked,
  DeploymentTracked,
  UserOwned,
  WithVersionHistory,
  Optional,
  Nullable,
  Entity,
  Timestamped,
  BaseEntity
} from './base';

// Agent types
export type {
  AgentType,
  BaseModelSettings,
  BaseAgentConfig,
  AgentConfigFrontend,
  AgentConfigBackend,
  CompareAgentRequest
} from './agent';