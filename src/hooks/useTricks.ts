import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Trick } from '@/types/trick';

/**
 * Hook to fetch all active tricks for the current parent user
 * Includes real-time subscription for instant updates
 */
export function useTricks() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Real-time subscription for tricks changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('tricks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tricks',
          filter: `parent_user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Trick changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['tricks', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['tricks', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tricks')
        .select('*')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Trick[];
    },
    enabled: !!user?.id,
  });
}
