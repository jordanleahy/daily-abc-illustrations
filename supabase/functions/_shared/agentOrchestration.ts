/**
 * Shared Agent Orchestration Utility
 * 
 * Centralizes agent selection, fallback logic, and performance metrics
 * for all edge functions that use AI agents.
 * 
 * @usage
 * ```typescript
 * import { 
 *   selectAgent, 
 *   selectChatAgent,
 *   getModelSettings, 
 *   createPerformanceMetric, 
 *   completePerformanceMetric,
 *   logOrchestration,
 *   getInlineFallbackPrompt 
 * } from '../_shared/agentOrchestration.ts';
 * ```
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { fetchAgentTypeMap, type AgentType } from './agentTypes.ts';

// ============================================
// TYPES
// ============================================

/**
 * Database agent record with all required fields for orchestration
 */
export interface AgentRecord {
  id: string;
  name: string;
  type: AgentType;
  version: string;
  instructions: string;
  model: string;
  max_completion_tokens: number;
  top_p: number;
  provider: string;
}

/**
 * Lightweight agent record for chat functions (fewer fields needed)
 */
export interface ChatAgentRecord {
  instructions: string;
  name: string;
  model: string;
  max_completion_tokens: number;
  top_p: number;
}

/**
 * Result of agent selection with source tracking
 */
export interface AgentSelectionResult<T = AgentRecord> {
  agent: T | null;
  source: 'specialized' | 'generic-fallback' | 'inline-fallback';
  agentType: AgentType;
  error?: string;
}

/**
 * Configuration options for agent selection
 */
export interface OrchestrationConfig {
  /** Book type to match against agent type mapping */
  bookType?: string;
  /** If true, returns error when no agent found instead of allowing inline fallback */
  requireAgent?: boolean;
  /** Minimum instruction length to consider agent valid (default: 500) */
  minPromptLength?: number;
}

/**
 * Data for creating performance metrics
 */
export interface PerformanceMetricData {
  agentId: string;
  agentType: AgentType;
  agentSource: string;
  bookType?: string;
  targetAge?: string;
  characterTheme?: string;
  sessionId?: string;
  additionalMetadata?: Record<string, unknown>;
}

// ============================================
// AGENT SELECTION (Full Record - for book creation)
// ============================================

/**
 * Selects the appropriate agent based on book type with fallback logic.
 * Returns full agent record suitable for book creation workflows.
 * 
 * Priority order:
 * 1. Specialized agent for the book type (e.g., book-creation-abc)
 * 2. Generic book-creation agent
 * 3. Inline fallback (if allowed by config)
 * 
 * @param supabase - Supabase client instance
 * @param config - Configuration options
 * @returns Agent selection result with source tracking
 */
export async function selectAgent(
  supabase: SupabaseClient,
  config: OrchestrationConfig = {}
): Promise<AgentSelectionResult<AgentRecord>> {
  const { bookType, requireAgent = false, minPromptLength = 500 } = config;
  
  console.log('[AgentOrchestration] Starting agent selection', { bookType, requireAgent });
  
  // Get dynamic agent type mapping from database (cached)
  const agentTypeMap = await fetchAgentTypeMap(supabase);
  const agentType: AgentType = agentTypeMap[bookType || 'other'] || 'book-creation';
  
  console.log('[AgentOrchestration] Mapped to agent type:', agentType);
  
  // Try specialized agent first (if not already generic)
  if (agentType !== 'book-creation') {
    const { data: specialized, error } = await supabase
      .from('agents')
      .select('id, name, type, version, instructions, model, max_completion_tokens, top_p, provider')
      .eq('type', agentType)
      .eq('is_latest', true)
      .maybeSingle();
    
    if (specialized && !error && validateAgent(specialized, minPromptLength)) {
      console.log('[AgentOrchestration] ✓ Using specialized agent:', specialized.name, 'version:', specialized.version);
      return { agent: specialized as AgentRecord, source: 'specialized', agentType };
    }
    
    if (error) {
      console.warn('[AgentOrchestration] Error fetching specialized agent:', error.message);
    } else {
      console.log('[AgentOrchestration] ⚠ Specialized agent not found or invalid, falling back to generic');
    }
  }
  
  // Fallback to generic book-creation agent
  const { data: generic, error: genericError } = await supabase
    .from('agents')
    .select('id, name, type, version, instructions, model, max_completion_tokens, top_p, provider')
    .eq('type', 'book-creation')
    .eq('is_latest', true)
    .maybeSingle();
  
  if (generic && !genericError && validateAgent(generic, minPromptLength)) {
    console.log('[AgentOrchestration] ✓ Using generic agent:', generic.name);
    return { agent: generic as AgentRecord, source: 'generic-fallback', agentType };
  }
  
  if (genericError) {
    console.error('[AgentOrchestration] Error fetching generic agent:', genericError.message);
  }
  
  // No agent found - check if we require one
  if (requireAgent) {
    console.error('[AgentOrchestration] ✗ No agents found and requireAgent=true');
    return { 
      agent: null, 
      source: 'inline-fallback', 
      agentType,
      error: 'No book creation agent configured. Please set up agents in the admin panel.'
    };
  }
  
  console.log('[AgentOrchestration] ⚠ No agent found, using inline fallback');
  return { agent: null, source: 'inline-fallback', agentType };
}

// ============================================
// AGENT SELECTION (Lightweight - for chat)
// ============================================

/**
 * Selects agent for chat workflows with minimal fields.
 * Optimized for the google-chat function which needs fewer agent fields.
 * 
 * @param supabase - Supabase client instance
 * @param bookType - Book type to match (optional)
 * @returns Agent selection result with chat-specific fields
 */
export async function selectChatAgent(
  supabase: SupabaseClient,
  bookType?: string
): Promise<AgentSelectionResult<ChatAgentRecord>> {
  console.log('[AgentOrchestration] Selecting chat agent for book type:', bookType);
  
  if (!bookType) {
    // No book type - return inline fallback immediately
    console.log('[AgentOrchestration] No book type, using inline discovery prompt');
    return { 
      agent: null, 
      source: 'inline-fallback', 
      agentType: 'book-creation' 
    };
  }
  
  // Get dynamic agent type mapping from database
  const agentTypeMap = await fetchAgentTypeMap(supabase);
  const agentType: AgentType = agentTypeMap[bookType] || 'book-creation';
  
  console.log(`[AgentOrchestration] 📚 Book type: ${bookType} → Agent: ${agentType}`);
  
  // Query database for specialized agent (include model settings)
  const { data: agent, error } = await supabase
    .from('agents')
    .select('instructions, name, model, max_completion_tokens, top_p')
    .eq('type', agentType)
    .eq('is_latest', true)
    .single();
  
  if (agent && !error && agent.instructions) {
    console.log(`[AgentOrchestration] ✅ Using ${agent.name} (${agent.instructions.length} chars)`);
    return { 
      agent: agent as ChatAgentRecord, 
      source: agentType === 'book-creation' ? 'generic-fallback' : 'specialized', 
      agentType 
    };
  }
  
  if (error) {
    console.warn('[AgentOrchestration] ⚠️ Agent fetch error:', error.message);
  }
  
  // Fallback to inline prompt
  console.log('[AgentOrchestration] ⚠️ Using inline discovery prompt');
  return { agent: null, source: 'inline-fallback', agentType };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validates an agent configuration meets minimum requirements
 */
function validateAgent(agent: Partial<AgentRecord>, minPromptLength: number): boolean {
  if (!agent.instructions || agent.instructions.length < minPromptLength) {
    console.warn(`[AgentOrchestration] Agent ${agent.name} has invalid prompt (${agent.instructions?.length || 0} chars, min: ${minPromptLength})`);
    return false;
  }
  return true;
}

// ============================================
// MODEL SETTINGS
// ============================================

/**
 * Model settings extracted from agent with defaults
 */
export interface ModelSettings {
  model: string;
  maxCompletionTokens: number;
  topP: number;
}

/**
 * Default model settings used when agent values are missing
 */
const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  model: 'google/gemini-2.5-flash',
  maxCompletionTokens: 8000,
  topP: 0.95
};

/**
 * Extracts model settings from agent with safe defaults.
 * Validates settings are within acceptable ranges.
 * 
 * @param agent - Agent record (or null for defaults)
 * @param overrides - Optional overrides for specific settings
 * @returns Complete model settings object
 */
export function getModelSettings(
  agent: Pick<AgentRecord | ChatAgentRecord, 'model' | 'max_completion_tokens' | 'top_p'> | null,
  overrides: Partial<ModelSettings> = {}
): ModelSettings {
  // Extract with fallbacks
  let model = overrides.model || agent?.model || DEFAULT_MODEL_SETTINGS.model;
  let maxCompletionTokens = overrides.maxCompletionTokens || agent?.max_completion_tokens || DEFAULT_MODEL_SETTINGS.maxCompletionTokens;
  let topP = overrides.topP || agent?.top_p || DEFAULT_MODEL_SETTINGS.topP;
  
  // Validate ranges (apply defaults if out of range)
  if (maxCompletionTokens < 100 || maxCompletionTokens > 100000) {
    console.warn(`[AgentOrchestration] Invalid max_completion_tokens ${maxCompletionTokens}, using default ${DEFAULT_MODEL_SETTINGS.maxCompletionTokens}`);
    maxCompletionTokens = DEFAULT_MODEL_SETTINGS.maxCompletionTokens;
  }
  
  if (topP < 0 || topP > 1) {
    console.warn(`[AgentOrchestration] Invalid top_p ${topP}, using default ${DEFAULT_MODEL_SETTINGS.topP}`);
    topP = DEFAULT_MODEL_SETTINGS.topP;
  }
  
  return { model, maxCompletionTokens, topP };
}

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * Creates a performance metric record for agent usage tracking.
 * Non-blocking - failures are logged but don't stop execution.
 * 
 * @param supabase - Supabase client instance
 * @param data - Metric data to record
 * @returns Metric ID for later updates, or null on failure
 */
export async function createPerformanceMetric(
  supabase: SupabaseClient,
  data: PerformanceMetricData
): Promise<string | null> {
  try {
    const { data: result, error } = await supabase
      .from('agent_performance_metrics')
      .insert({
        agent_id: data.agentId,
        agent_type: data.agentType,
        metadata_captured: {
          bookType: data.bookType,
          targetAge: data.targetAge,
          characterTheme: data.characterTheme,
          agentSource: data.agentSource,
          sessionId: data.sessionId,
          ...data.additionalMetadata
        }
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[AgentOrchestration] Failed to create performance metric:', error.message);
      return null;
    }
    
    console.log('[AgentOrchestration] Created performance metric:', result.id);
    return result.id;
  } catch (err) {
    console.error('[AgentOrchestration] Exception creating performance metric:', err);
    return null;
  }
}

/**
 * Updates a performance metric with completion data.
 * Called after book creation completes successfully.
 * 
 * @param supabase - Supabase client instance
 * @param metricId - ID returned from createPerformanceMetric
 * @param data - Completion data to record
 */
export async function completePerformanceMetric(
  supabase: SupabaseClient,
  metricId: string,
  data: {
    bookId?: string;
    bookCreated?: boolean;
    totalPages?: number;
    userEditedPages?: number;
    userSatisfaction?: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('agent_performance_metrics')
      .update({
        book_id: data.bookId,
        book_created: data.bookCreated,
        total_pages: data.totalPages,
        user_edited_pages: data.userEditedPages,
        user_satisfaction: data.userSatisfaction,
        completed_at: new Date().toISOString()
      })
      .eq('id', metricId);
    
    if (error) {
      console.error('[AgentOrchestration] Failed to update performance metric:', error.message);
    } else {
      console.log('[AgentOrchestration] Completed performance metric:', metricId);
    }
  } catch (err) {
    console.error('[AgentOrchestration] Exception updating performance metric:', err);
  }
}

// ============================================
// INLINE FALLBACK PROMPTS
// ============================================

/**
 * Returns inline fallback prompt when no agent is configured.
 * Used as last resort when database agents are unavailable.
 * 
 * @param bookType - Optional book type for context-specific prompt
 * @returns Fallback system prompt string
 */
export function getInlineFallbackPrompt(bookType?: string): string {
  if (!bookType) {
    return `You are a helpful AI assistant for creating children's educational books. Help users explore different book types: ABC, Numbers, Colors, Shapes, Animals, Rhyming, Emotions, Opposites, First Words, CVC Words, Sight Words, and Bedtime stories. Ask which type interests them.`;
  }
  
  // Provide book-type-specific fallback
  const typeDescriptions: Record<string, string> = {
    'abc': 'alphabet learning with letters A-Z',
    'numbers': 'number recognition and counting',
    'colors': 'color identification and exploration',
    'shapes': 'shape recognition and geometry basics',
    'animals': 'animal discovery and wildlife education',
    'rhyming': 'rhyme patterns and phonemic awareness',
    'emotions': 'emotional intelligence and feelings vocabulary',
    'opposites': 'contrasting concepts and vocabulary building',
    'first-words': 'early vocabulary development',
    'cvc': 'consonant-vowel-consonant word patterns',
    'sight-words': 'high-frequency word recognition',
    'bedtime': 'calming bedtime stories and routines',
    'manners': 'social skills and etiquette',
    'digraphs': 'two-letter sound combinations'
  };
  
  const description = typeDescriptions[bookType] || bookType;
  
  return `You are an AI assistant specializing in creating ${description} educational books for children. Guide the user through creating their personalized book step by step, asking about age group, theme preferences, and specific content they'd like to include.`;
}

// ============================================
// LOGGING UTILITIES
// ============================================

/**
 * Structured log data for orchestration events
 */
export interface OrchestrationLog {
  agentId?: string;
  agentName?: string;
  agentType: AgentType;
  version?: string;
  source: string;
  promptLength: number;
  promptSource?: string;
}

/**
 * Logs orchestration details in a consistent format.
 * Provides structured logging for debugging and monitoring.
 * 
 * @param log - Orchestration log data
 */
export function logOrchestration(log: OrchestrationLog): void {
  console.log('[AgentOrchestration] Agent selected:', {
    agentId: log.agentId || 'N/A',
    agentName: log.agentName || 'Inline Fallback',
    agentType: log.agentType,
    version: log.version || 'N/A',
    source: log.source,
    promptLength: log.promptLength,
    promptSource: log.promptSource || 'database'
  });
}
