import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CategorizationPreview {
  book_id: string;
  book_name: string;
  current_category: string | null;
  current_book_type: string | null;
  proposed_book_type: string;
  confidence_score: number;
  reasoning: string;
  needs_review: boolean;
}

export interface CategorizationPreviewResponse {
  success: boolean;
  total_books: number;
  books_needing_categorization: number;
  high_confidence_count: number;
  needs_review_count: number;
  previews: CategorizationPreview[];
}

export const useCategorizeBooks = () => {
  const queryClient = useQueryClient();

  // Fetch categorization preview
  const preview = useQuery({
    queryKey: ['book-categorization-preview'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<CategorizationPreviewResponse>(
        'categorize-existing-books'
      );

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply categorization changes
  const applyChanges = useMutation({
    mutationFn: async (changes: Array<{
      book_id: string;
      new_book_type: string;
      confidence_score?: number;
      notes?: string;
    }>) => {
      const { data, error } = await supabase.functions.invoke(
        'apply-book-categorization',
        { body: { changes } }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-categorization-preview'] });
      queryClient.invalidateQueries({ queryKey: ['categorization-logs'] });
    },
  });

  // Rollback changes
  const rollback = useMutation({
    mutationFn: async (params: {
      log_ids?: string[];
      rollback_all_since?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'rollback-categorization',
        { body: params }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-categorization-preview'] });
      queryClient.invalidateQueries({ queryKey: ['categorization-logs'] });
    },
  });

  return {
    preview,
    applyChanges,
    rollback,
  };
};

// Hook to fetch categorization logs
export const useCategorizationLogs = () => {
  return useQuery({
    queryKey: ['categorization-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_categorization_log')
        .select('*')
        .order('applied_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};
