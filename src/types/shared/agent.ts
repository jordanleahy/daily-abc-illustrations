import { AgentStatus } from './status';
import { BaseEntity, VersionTracked, DeploymentTracked, Optional } from './base';

/**
 * Agent type enumeration for specialized capabilities
 */
export type AgentType = 'chat' | 'book-creation' | 'illustration-director' | 'graphic-designer';

/**
 * Base agent model settings shared between frontend and backend
 */
export interface BaseModelSettings {
  /** OpenAI model identifier */
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
  /** OpenAI Assistant ID for assistant-type agents */
  assistantId?: string;
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