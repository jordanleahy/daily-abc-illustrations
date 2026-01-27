import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StaticOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  label: string;
  description: string | null;
  options_table: string | null;
  options_label_column: string | null;
  options_value_column: string | null;
  static_options: StaticOption[] | null;
  icon_name: string | null;
  placeholder_key: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionInput {
  id: string;
  label: string;
  description?: string;
  options_table?: string | null;
  options_label_column?: string | null;
  options_value_column?: string | null;
  static_options?: StaticOption[] | null;
  icon_name?: string;
  placeholder_key: string;
  is_active?: boolean;
  sort_order?: number;
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
 * Convert database row to Question type with proper static_options parsing
 */
function parseQuestion(row: any): Question {
  return {
    ...row,
    static_options: Array.isArray(row.static_options) 
      ? row.static_options as StaticOption[]
      : null,
  };
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

      return (data || []).map(parseQuestion);
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
        question: parseQuestion(item.question)
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
      // Step 1: Update the target question's enabled status
      const { data: existing } = await supabase
        .from('agent_questions')
        .select('id')
        .eq('agent_type', agentType)
        .eq('question_id', questionId)
        .single();

      // Use temporary sort_order: 999 for enabling (will be resequenced), 100 for disabling
      const tempSortOrder = isEnabled ? 999 : 100;

      if (existing) {
        const { error } = await supabase
          .from('agent_questions')
          .update({ is_enabled: isEnabled, sort_order: tempSortOrder })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agent_questions')
          .insert({
            agent_type: agentType,
            question_id: questionId,
            is_enabled: isEnabled,
            sort_order: tempSortOrder,
          });

        if (error) throw error;
      }

      // Step 2: Re-sequence ALL enabled questions for this agent (0, 1, 2, 3...)
      const { data: enabledQuestions, error: fetchError } = await supabase
        .from('agent_questions')
        .select('id')
        .eq('agent_type', agentType)
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Update each enabled question with sequential sort_order
      if (enabledQuestions && enabledQuestions.length > 0) {
        for (let i = 0; i < enabledQuestions.length; i++) {
          const { error } = await supabase
            .from('agent_questions')
            .update({ sort_order: i })
            .eq('id', enabledQuestions[i].id);
          
          if (error) throw error;
        }
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
 * Reorder a question by moving it up or down
 */
export function useReorderAgentQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentType,
      questionId,
      direction,
    }: {
      agentType: string;
      questionId: string;
      direction: 'up' | 'down';
    }) => {
      // Get all agent questions sorted by sort_order, then by created_at for stable ordering
      const { data: agentQuestions, error: fetchError } = await supabase
        .from('agent_questions')
        .select('id, question_id, sort_order')
        .eq('agent_type', agentType)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (!agentQuestions || agentQuestions.length < 2) return;

      // Find current index
      const currentIndex = agentQuestions.findIndex(q => q.question_id === questionId);
      if (currentIndex === -1) return;

      // Calculate target index
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= agentQuestions.length) return;

      // Get the two items to swap
      const currentItem = agentQuestions[currentIndex];
      const targetItem = agentQuestions[targetIndex];

      // Use a temporary negative value to avoid unique constraint violation during swap
      // Step 1: Set current item to temporary value (-1)
      const { error: tempError } = await supabase
        .from('agent_questions')
        .update({ sort_order: -1 })
        .eq('id', currentItem.id);
      
      if (tempError) throw tempError;

      // Step 2: Move target item to current's position
      const { error: targetError } = await supabase
        .from('agent_questions')
        .update({ sort_order: currentIndex })
        .eq('id', targetItem.id);
      
      if (targetError) throw targetError;

      // Step 3: Move current item to target's position
      const { error: currentError } = await supabase
        .from('agent_questions')
        .update({ sort_order: targetIndex })
        .eq('id', currentItem.id);
      
      if (currentError) throw currentError;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['agent-questions', variables.agentType] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<AgentQuestionWithDetails[]>(['agent-questions', variables.agentType]);

      // Optimistically update
      if (previousData) {
        const currentIndex = previousData.findIndex(q => q.question_id === variables.questionId);
        if (currentIndex !== -1) {
          const targetIndex = variables.direction === 'up' ? currentIndex - 1 : currentIndex + 1;
          if (targetIndex >= 0 && targetIndex < previousData.length) {
            const newData = [...previousData];
            // Swap items
            [newData[currentIndex], newData[targetIndex]] = [newData[targetIndex], newData[currentIndex]];
            // Update sort_order values
            newData.forEach((item, idx) => {
              item.sort_order = idx;
            });
            queryClient.setQueryData(['agent-questions', variables.agentType], newData);
          }
        }
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['agent-questions', variables.agentType], context.previousData);
      }
      console.error('Error reordering question:', error);
      toast.error('Failed to reorder question');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-questions', variables.agentType] });
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
