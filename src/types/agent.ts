/**
 * Configuration interface for AI agents in the system
 * Represents all aspects of an agent including its behavior, model settings, and metadata
 */
export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;
  /** Display name shown to users */
  name: string;
  /** Agent type determining its specialized capabilities and role */
  type: 'chat' | 'book-creation' | 'book-creation-numbers' | 'book-creation-rhyming' | 'book-creation-colors' | 'book-creation-abc';
  /** Description of the agent's purpose and goals */
  intent: string;
  /** Current operational status */
  status: 'online' | 'offline' | 'processing';
  /** Semantic version string (e.g., "v1.0.0") */
  version: string;
  /** Timestamp when the agent was first created */
  createdAt: Date;
  /** Timestamp of the last modification */
  lastModified: Date;
  /** System instructions that define the agent's behavior and responses */
  instructions: string;
  /** AI provider (OpenAI, DeepSeek, or Google) */
  provider: 'openai' | 'deepseek' | 'google';
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
  /** Configuration for the underlying AI model */
  modelSettings: {
    /** AI model identifier (e.g., "gpt-5-2025-08-07", "deepseek-chat", or "gemini-1.5-flash") */
    model: string;
    /** Maximum tokens the model can generate in response */
    maxCompletionTokens: number;
    /** Nucleus sampling parameter controlling randomness (0.0 to 1.0) */
    topP: number;
  };
}
