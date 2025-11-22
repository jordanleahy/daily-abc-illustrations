import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { TrickGoalWithDetails } from '@/types/trick';

/**
 * Hook to fetch all trick goals with progress for all kids
 * Includes related trick and kid profile data
 */
export function useTrickGoals(kidProfileId?: string) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('trick-goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trick_goals',
          filter: `parent_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trick-goals'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['trick-goals', user?.id, kidProfileId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('trick_goals')
        .select(`
          *,
          tricks!inner(*),
          kid_profiles(id, first_name, last_name, profile_image_url, earned_coins)
        `)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .eq('tricks.is_active', true)
        .order('created_at', { ascending: false });

      if (kidProfileId) {
        query = query.eq('kid_profile_id', kidProfileId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrickGoalWithDetails[];
    },
    enabled: !!user?.id,
  });
}
