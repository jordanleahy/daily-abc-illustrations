import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Habit } from '@/types/habit';

/**
 * Hook to fetch all active habits for the current parent user
 * Includes real-time subscription for instant updates across devices
 */
export function useHabits() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Real-time subscription for habits changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('habits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habits',
          filter: `parent_user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Habit changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['habits', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .is('book_id', null)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user?.id,
  });
}
