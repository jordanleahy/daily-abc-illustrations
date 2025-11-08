import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AssessWordParams {
  kidProfileId: string;
  bookId: string;
  pageId: string;
  word: string;
  wordIndex: number;
  knowsWord: boolean;
}

export const useWordAssessment = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AssessWordParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('word_assessments')
        .insert({
          parent_user_id: user.id,
          kid_profile_id: params.kidProfileId,
          book_id: params.bookId,
          page_id: params.pageId,
          word: params.word,
          word_index: params.wordIndex,
          knows_word: params.knowsWord,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Error saving word assessment:', error);
      toast.error('Failed to save assessment');
    }
  });
};
