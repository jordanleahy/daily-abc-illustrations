import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Question {
  id: string;
  label: string;
  description: string | null;
  options_table: string | null;
  options_label_column: string | null;
  options_value_column: string | null;
  placeholder_key: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AgentQuestion {
  id: string;
  agent_type: string;
  question_id: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AgentQuestionWithDetails extends AgentQuestion {
  question: Question;
}

/**
 * Fetch all questions from the registry
 */
export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch agent-question mappings for a specific agent type
 */
export function useAgentQuestions(agentType: string | undefined) {
  return useQuery({
    queryKey: ['agent-questions', agentType],
    queryFn: async (): Promise<AgentQuestionWithDetails[]> => {
      if (!agentType) return [];

      const { data, error } = await supabase
        .from('agent_questions')
        .select(`
          *,
          question:questions(*)
        `)
        .eq('agent_type', agentType)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching agent questions:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        question: item.question as Question
      }));
    },
    enabled: !!agentType,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Toggle a question's enabled status for an agent
 */
export function useToggleAgentQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      agentType, 
      questionId, 
      isEnabled 
    }: { 
      agentType: string; 
      questionId: string; 
      isEnabled: boolean;
    }) => {
      // Check if mapping exists
      const { data: existing } = await supabase
        .from('agent_questions')
        .select('id')
        .eq('agent_type', agentType)
        .eq('question_id', questionId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('agent_questions')
          .update({ is_enabled: isEnabled })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new mapping
        const { error } = await supabase
          .from('agent_questions')
          .insert({
            agent_type: agentType,
            question_id: questionId,
            is_enabled: isEnabled,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-questions', variables.agentType] });
      toast.success(variables.isEnabled ? 'Question enabled' : 'Question disabled');
    },
    onError: (error) => {
      console.error('Error toggling agent question:', error);
      toast.error('Failed to update question');
    },
  });
}

/**
 * Initialize all questions for an agent (creates mappings if they don't exist)
 */
export function useInitializeAgentQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentType: string) => {
      // Get all questions
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id')
        .eq('is_active', true);

      if (qError) throw qError;

      // Get existing mappings for this agent
      const { data: existing, error: eError } = await supabase
        .from('agent_questions')
        .select('question_id')
        .eq('agent_type', agentType);

      if (eError) throw eError;

      const existingIds = new Set((existing || []).map(e => e.question_id));
      
      // Create mappings for questions that don't have one
      const newMappings = (questions || [])
        .filter(q => !existingIds.has(q.id))
        .map(q => ({
          agent_type: agentType,
          question_id: q.id,
          is_enabled: false,
        }));

      if (newMappings.length > 0) {
        const { error } = await supabase
          .from('agent_questions')
          .insert(newMappings);

        if (error) throw error;
      }
    },
    onSuccess: (_, agentType) => {
      queryClient.invalidateQueries({ queryKey: ['agent-questions', agentType] });
    },
  });
}

/**
 * Get enabled questions for an agent as a formatted object for prompt injection
 */
export async function getAgentEnabledQuestions(agentType: string): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('agent_questions')
    .select('question_id, is_enabled')
    .eq('agent_type', agentType);

  if (error) {
    console.error('Error fetching enabled questions:', error);
    return {};
  }

  return (data || []).reduce((acc, item) => {
    acc[item.question_id] = item.is_enabled;
    return acc;
  }, {} as Record<string, boolean>);
}
