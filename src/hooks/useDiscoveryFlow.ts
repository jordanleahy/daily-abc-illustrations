import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { BOOK_TYPE_TO_AGENT_TYPE } from '@/types/shared/agent';

export interface DiscoveryOption {
  key: string;
  label: string;
}

export interface DiscoveryQuestion {
  id: string;
  agent_type: string;
  question_key: string;
  question_text: string;
  options: DiscoveryOption[];
  step_number: number;
  frontend_state_key: string | null;
  context_value_key: string | null;
  is_skippable: boolean;
  is_active: boolean;
}

export interface DiscoveryAnswers {
  [questionKey: string]: string;
}

/**
 * Hook for managing the discovery question flow in the frontend.
 * Replaces AI-driven question flow with deterministic state machine.
 * 
 * Questions are fetched from type_specific_discoveries table and
 * presented in step_number order. Frontend controls the flow.
 */
export function useDiscoveryFlow(agentType: string | null) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<DiscoveryAnswers>({});
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());

  // Fetch questions from database ordered by step_number
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['discovery-flow', agentType],
    queryFn: async () => {
      if (!agentType) return [];
      
      const { data, error } = await supabase
        .from('type_specific_discoveries')
        .select('*')
        .eq('agent_type', agentType)
        .eq('is_active', true)
        .order('step_number', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching discovery questions:', error);
        return [];
      }

      return (data || []).map(d => ({
        id: d.id,
        agent_type: d.agent_type,
        question_key: d.question_key,
        question_text: d.question_text,
        options: (d.options as unknown as DiscoveryOption[]) || [],
        step_number: d.step_number ?? 1,
        frontend_state_key: d.frontend_state_key,
        context_value_key: d.context_value_key,
        is_skippable: d.is_skippable ?? true,
        is_active: d.is_active,
      })) as DiscoveryQuestion[];
    },
    enabled: !!agentType,
    staleTime: 60 * 1000, // 1 minute - short for development
  });

  // Current question based on step
  const currentQuestion = useMemo(() => {
    if (!questions.length || currentStep >= questions.length) return null;
    return questions[currentStep];
  }, [questions, currentStep]);

  // Check if flow is complete
  const isComplete = useMemo(() => {
    return questions.length > 0 && currentStep >= questions.length;
  }, [questions.length, currentStep]);

  // Answer a question and advance to next step
  const answerQuestion = useCallback((questionKey: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionKey]: value }));
    setCurrentStep(s => s + 1);
  }, []);

  // Skip a question (only if skippable)
  const skipQuestion = useCallback((questionKey: string) => {
    setSkippedQuestions(prev => new Set(prev).add(questionKey));
    setCurrentStep(s => s + 1);
  }, []);

  // Go back to previous question
  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  // Reset flow to start
  const reset = useCallback(() => {
    setCurrentStep(0);
    setAnswers({});
    setSkippedQuestions(new Set());
  }, []);

  // Reset when agent type changes
  useEffect(() => {
    reset();
  }, [agentType, reset]);

  // Get context object for passing to edge function
  const getContext = useCallback(() => {
    const context: Record<string, string> = {};
    
    questions.forEach(q => {
      if (q.context_value_key && answers[q.question_key]) {
        context[q.context_value_key] = answers[q.question_key];
      }
    });
    
    return context;
  }, [questions, answers]);

  // Progress info
  const progress = useMemo(() => ({
    current: currentStep + 1,
    total: questions.length,
    percentage: questions.length > 0 ? Math.round((currentStep / questions.length) * 100) : 0,
  }), [currentStep, questions.length]);

  return {
    // State
    questions,
    currentQuestion,
    currentStep,
    answers,
    skippedQuestions,
    isLoading,
    isComplete,
    progress,
    
    // Actions
    answerQuestion,
    skipQuestion,
    goBack,
    reset,
    getContext,
  };
}

/**
 * Maps book type to agent type for discovery questions.
 * Uses the canonical BOOK_TYPE_TO_AGENT_TYPE mapping from shared types
 * to ensure consistency with edge functions and agents table.
 */
export function getAgentTypeForBookType(bookType: string | null): string | null {
  if (!bookType) return null;
  return BOOK_TYPE_TO_AGENT_TYPE[bookType] || null;
}
