import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { addDays, format } from 'date-fns';

/**
 * Hook to fetch scheduled habit IDs for a specific date (default: tomorrow)
 */
export function useHabitSchedule(date: Date = addDays(new Date(), 1)) {
  const { user } = useAuthContext();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['habit-schedule', user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('habit_schedule')
        .select('habit_id')
        .eq('parent_user_id', user.id)
        .eq('scheduled_date', dateStr);

      if (error) throw error;
      
      // Return a Set of scheduled habit IDs for fast lookup
      return new Set(data.map(item => item.habit_id));
    },
    enabled: !!user?.id,
  });
}
