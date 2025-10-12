import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Habit } from '@/types/habit';

/**
 * Hook to fetch all active habits for the current parent user
 */
export function useHabits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // TODO: Uncomment when database tables are created
      // const { data, error } = await supabase
      //   .from('habits')
      //   .select('*')
      //   .eq('parent_user_id', user.id)
      //   .eq('is_active', true)
      //   .order('display_order', { ascending: true });

      // if (error) throw error;
      // return data as Habit[];
      
      // Mock data for now
      return [] as Habit[];
    },
    enabled: !!user?.id,
  });
}
