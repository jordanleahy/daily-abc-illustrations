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
    staleTime: 0, // Always fetch fresh data to ensure is_system_product is loaded
    refetchOnMount: true, // Fetch on mount to get latest data
    refetchOnWindowFocus: false,
  });
};
