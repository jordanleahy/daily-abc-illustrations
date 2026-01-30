/**
 * Shared Agent Types
 * 
 * Re-exports dynamic agent type utilities from the single source of truth.
 * The database `book_types` table drives agent type generation.
 * 
 * @sync supabase/functions/_shared/agentTypes.ts for backend equivalent
 */

import { AgentStatus } from './status';
import { BaseEntity, VersionTracked, DeploymentTracked, Optional } from './base';

// Re-export dynamic utilities from the single source of truth
export { 
  type AgentType, 
  type StaticAgentType,
  type AIProvider,
  bookTypeToAgentType,
  buildAgentTypeMap,
  isValidAgentType,
  STATIC_AGENT_TYPES,
  STATIC_BOOK_TYPE_TO_AGENT_TYPE,
} from '@/utils/agentTypeUtils';

/**
 * @deprecated Use `buildAgentTypeMap()` from useBookTypes hook for dynamic mapping
 * This static mapping is kept for backward compatibility only
 */
export const BOOK_TYPE_TO_AGENT_TYPE = {
  'numbers': 'book-creation-numbers',
  'rhyming': 'book-creation-rhyming',
  'colors': 'book-creation-colors',
  'abc': 'book-creation-abc',
  'shapes': 'book-creation-shapes',
  'animals': 'book-creation-animals',
  'sight-words': 'book-creation-sight-words',
  'emotions': 'book-creation-emotions',
  'cvc': 'book-creation-cvc',
  'opposites': 'book-creation-opposites',
  'first-words': 'book-creation-first-words',
  'bedtime': 'book-creation-bedtime',
  'general': 'book-creation-general',
  'digraphs': 'book-creation-digraphs',
  'dr-seuss': 'book-creation-dr-seuss',
  'manners': 'book-creation-manners',
  'parent-education': 'book-creation-parent-education',
  'other': 'book-creation'
} as const;

/**
 * Base agent model settings shared between frontend and backend
 */
export interface BaseModelSettings {
  /** AI model identifier */
  model: string;
  /** Maximum tokens for completion */
  maxCompletionTokens: number;
  /** Nucleus sampling parameter (0.0 to 1.0) */
  topP: number;
}

/**
 * Base agent configuration shared between frontend and backend
 */
export interface BaseAgentConfig {
  /** Display name shown to users */
  name: string;
  /** Agent type determining its specialized capabilities and role */
  type: import('@/utils/agentTypeUtils').AgentType;
  /** Description of the agent's purpose and goals */
  intent: string;
  /** Current operational status */
  status: AgentStatus;
  /** System instructions that define the agent's behavior and responses */
  instructions: string;
  /** AI provider (OpenAI, DeepSeek, or Google) */
  provider: import('@/utils/agentTypeUtils').AIProvider;
  /** Configuration for the underlying AI model */
  modelSettings: BaseModelSettings;
}

/**
 * Frontend-specific agent configuration with full metadata
 */
export interface AgentConfigFrontend extends BaseEntity, BaseAgentConfig, VersionTracked, Optional<DeploymentTracked, 'deployed_at'> {
  /** Semantic version string (e.g., "v1.0.0") */
  version: string;
  /** Timestamp when the agent was first created */
  createdAt: Date;
  /** Timestamp of the last modification */
  lastModified: Date;
  /** AI-generated description of what changed in the latest version */
  whatChanged?: string;
  /** Human-readable description of the last change */
  lastChangeDescription?: string;
  /** Incremental version number for ordering */
  versionNumber?: number;
  /** Whether this is the current active version */
  isLatest?: boolean;
  /** ID of the parent agent if this is a derived version */
  parentAgentId?: string;
}

/**
 * Backend-specific agent configuration for edge functions
 * Simplified version without UI-specific metadata
 */
export interface AgentConfigBackend extends BaseAgentConfig {
  /** Unique identifier for the agent */
  id: string;
}

/**
 * Request interface for comparing two agent configurations
 * Used by edge functions for change detection
 */
export interface CompareAgentRequest {
  /** Previous agent configuration */
  originalConfig: AgentConfigBackend;
  /** New agent configuration to compare against */
  newConfig: AgentConfigBackend;
}
