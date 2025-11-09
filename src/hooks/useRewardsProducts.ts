import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { RewardsProduct } from '@/types/rewardsProduct';

export const useRewardsProducts = () => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['rewards-products', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('kid_rewards_products')
        .select('*')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as RewardsProduct[];
    },
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000, // 1 hour - instant loading for returning users
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for full day
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });
};
