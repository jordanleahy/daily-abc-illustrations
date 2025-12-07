import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddTrickCompletionParams } from '@/types/trick';
import { useAuthContext } from '@/contexts/AuthContext';
import { SafeLocalStorage, KID_PROFILES_CACHE_KEY } from '@/utils/storage';

/**
 * Hook to add a trick completion and update progress
 * Uses the database function for atomic operations
 */
interface TrickCompletionResult {
  success: boolean;
  points_awarded: number;
  new_count: number;
  target_count: number;
  goal_completed: boolean;
  trick_name: string;
}

export function useAddTrickCompletion() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ goalId, count_increment, notes }: AddTrickCompletionParams) => {
      const { data, error } = await supabase.rpc('create_trick_completion_unified', {
        p_goal_id: goalId,
        p_count_increment: count_increment,
        p_notes: notes || null,
      });

      if (error) throw error;
      return data as unknown as TrickCompletionResult;
    },
    onSuccess: (data) => {
      // Clear LocalStorage cache for immediate fresh data
      if (user?.id) {
        const cacheKey = `${KID_PROFILES_CACHE_KEY}_${user.id}`;
        SafeLocalStorage.remove(cacheKey);
      }
      
      // Invalidate with predicate to match all kid-profiles queries
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'kid-profiles' 
      });
      queryClient.invalidateQueries({ queryKey: ['trick-goals'] });
      queryClient.invalidateQueries({ queryKey: ['kid-coins'] });
      
      if (data.goal_completed) {
        toast.success(`🎉 Goal completed! ${data.trick_name} mastered!`, {
          description: `Earned ${data.points_awarded} coins! ${data.new_count}/${data.target_count}`,
          duration: 5000,
        });
      } else if (data.points_awarded > 0) {
        toast.success(`+${data.points_awarded} coins earned!`, {
          description: `Progress: ${data.new_count}/${data.target_count}`,
        });
      } else {
        toast.info('Attempt recorded', {
          description: 'Keep practicing, you\'ll get it!',
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to add completion:', error);
      toast.error(error.message || 'Failed to record completion');
    },
  });
}
