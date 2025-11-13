import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { WordMetadata } from '@/utils/wordParser';

interface SaveWordMarkParams {
  kidProfileId: string;
  bookId: string;
  pageId: string;
  wordMetadata: WordMetadata;
  sentenceContext: string;
  status: 'difficult' | 'understood' | 'skipped';
}

interface WordProgressRecord {
  id: string;
  kid_profile_id: string;
  parent_user_id: string;
  book_id: string | null;
  page_id: string | null;
  word_text: string;
  word_metadata: any;
  sentence_context: string | null;
  status: 'difficult' | 'understood' | 'skipped';
  marked_at: string;
  session_context: any;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for tracking word learning progress per kid profile
 * Saves word marks (difficult/understood/skipped) to database for recommendation engine
 */
export function useWordLearningProgress(kidProfileId?: string) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Mutation to save word mark to database
  const saveWordMark = useMutation({
    mutationFn: async (params: SaveWordMarkParams) => {
      if (!user) {
        throw new Error('User must be authenticated to save word progress');
      }

      const { data, error } = await supabase
        .from('word_learning_progress')
        .insert([{
          kid_profile_id: params.kidProfileId,
          parent_user_id: user.id,
          book_id: params.bookId,
          page_id: params.pageId,
          word_text: params.wordMetadata.word,
          word_metadata: params.wordMetadata as any,
          sentence_context: params.sentenceContext,
          status: params.status,
          marked_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving word progress:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh recommendations
      queryClient.invalidateQueries({ 
        queryKey: ['word-progress', variables.kidProfileId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['word-recommendations', variables.kidProfileId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['difficult-words', variables.kidProfileId] 
      });
    },
    onError: (error) => {
      console.error('Failed to save word progress:', error);
      toast.error('Failed to save word progress');
    }
  });

  // Query to get difficult words for a kid
  const difficultWords = useQuery({
    queryKey: ['difficult-words', kidProfileId],
    queryFn: async () => {
      if (!kidProfileId) return [];
      
      const { data, error } = await supabase
        .from('word_learning_progress')
        .select('*')
        .eq('kid_profile_id', kidProfileId)
        .eq('status', 'difficult')
        .order('marked_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching difficult words:', error);
        throw error;
      }
      
      return (data || []) as WordProgressRecord[];
    },
    enabled: !!kidProfileId,
  });

  // Query to get all word progress for a kid (for analytics)
  const allWordProgress = useQuery({
    queryKey: ['word-progress', kidProfileId],
    queryFn: async () => {
      if (!kidProfileId) return [];
      
      const { data, error } = await supabase
        .from('word_learning_progress')
        .select('*')
        .eq('kid_profile_id', kidProfileId)
        .order('marked_at', { ascending: false });

      if (error) {
        console.error('Error fetching word progress:', error);
        throw error;
      }
      
      return (data || []) as WordProgressRecord[];
    },
    enabled: !!kidProfileId,
  });

  // Get statistics for a kid's word learning
  const wordStats = useQuery({
    queryKey: ['word-stats', kidProfileId],
    queryFn: async () => {
      if (!kidProfileId) return null;
      
      const { data, error } = await supabase
        .from('word_learning_progress')
        .select('status, word_text')
        .eq('kid_profile_id', kidProfileId);

      if (error) {
        console.error('Error fetching word stats:', error);
        throw error;
      }

      const stats = {
        totalWords: data.length,
        difficultCount: data.filter(w => w.status === 'difficult').length,
        understoodCount: data.filter(w => w.status === 'understood').length,
        skippedCount: data.filter(w => w.status === 'skipped').length,
        uniqueWords: new Set(data.map(w => w.word_text)).size,
      };
      
      return stats;
    },
    enabled: !!kidProfileId,
  });

  return {
    saveWordMark,
    difficultWords,
    allWordProgress,
    wordStats,
  };
}
