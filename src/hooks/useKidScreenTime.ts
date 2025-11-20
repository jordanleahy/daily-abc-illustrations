import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useKidScreenTime = (kidId: string) => {
  return useQuery({
    queryKey: ['kid-screen-time', kidId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kid_profiles')
        .select('screen_time_balance_seconds')
        .eq('id', kidId)
        .single();
      
      if (error) throw error;
      return data.screen_time_balance_seconds || 0;
    },
    enabled: !!kidId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};
