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
      
      // Hardcoded mock habits
      const now = new Date().toISOString();
      return [
        {
          id: 'habit-1-mock-uuid',
          parent_user_id: user.id,
          title: 'Hang up pajamas on hook',
          description: 'Please hang up your pajamas on your bed',
          photo_url: null,
          coin_amount: 10,
          deadline_time: null,
          is_active: true,
          display_order: 0,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'habit-2-mock-uuid',
          parent_user_id: user.id,
          title: 'Do not play with any toys',
          description: null,
          photo_url: null,
          coin_amount: 10,
          deadline_time: null,
          is_active: true,
          display_order: 1,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'habit-3-mock-uuid',
          parent_user_id: user.id,
          title: 'Sit still for mommy to brush your hair',
          description: null,
          photo_url: null,
          coin_amount: 10,
          deadline_time: null,
          is_active: true,
          display_order: 2,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'habit-4-mock-uuid',
          parent_user_id: user.id,
          title: 'Make sure your pup pack is ready and on the stroller',
          description: null,
          photo_url: null,
          coin_amount: 10,
          deadline_time: null,
          is_active: true,
          display_order: 3,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'habit-5-mock-uuid',
          parent_user_id: user.id,
          title: 'Put your shoes on and your coat',
          description: null,
          photo_url: null,
          coin_amount: 10,
          deadline_time: null,
          is_active: true,
          display_order: 4,
          created_at: now,
          updated_at: now,
        },
      ] as Habit[];
    },
    enabled: !!user?.id,
  });
}
