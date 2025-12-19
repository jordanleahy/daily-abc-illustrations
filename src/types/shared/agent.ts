import { AgentStatus } from './status';
import { BaseEntity, VersionTracked, DeploymentTracked, Optional } from './base';

/**
 * Agent type enumeration for specialized capabilities
 * Expanded to support theme-specific book creation agents
 */
export type AgentType = 
  | 'chat' 
  | 'book-creation'                  // Generic fallback
  | 'book-creation-numbers'          // Numbers/counting
  | 'book-creation-rhyming'          // Rhymes/phonics
  | 'book-creation-colors'           // Color learning
  | 'book-creation-abc'              // Alphabet
  | 'book-creation-shapes'
  | 'book-creation-animals'
  | 'book-creation-sight-words'
  | 'book-creation-emotions'
  | 'book-creation-cvc'
  | 'book-creation-opposites'
  | 'book-creation-first-words'
  | 'book-creation-bedtime'
  | 'book-creation-general'          // Custom topic books
  | 'book-creation-digraphs'         // Digraph phonics
  | 'book-creation-dr-seuss'         // Dr. Seuss whimsical style
  | 'book-creation-parent-education'; // Parent literacy education

/**
 * Maps book types to specialized agent types for orchestration
 */
export const BOOK_TYPE_TO_AGENT_TYPE: Record<string, AgentType> = {
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
  'parent-education': 'book-creation-parent-education',
  // Fallback for unknown types
  'other': 'book-creation'
} as const;

/**
 * AI provider types
 */
export type AIProvider = 'openai' | 'deepseek' | 'google';

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
  type: AgentType;
  /** Description of the agent's purpose and goals */
  intent: string;
  /** Current operational status */
  status: AgentStatus;
  /** System instructions that define the agent's behavior and responses */
  instructions: string;
  /** AI provider (OpenAI or DeepSeek) */
  provider: AIProvider;
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