import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { KidPurchaseWithDetails } from '@/types/kidPurchase';

export const useKidPurchases = (kidId?: string) => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['kid-purchases', user?.id, kidId],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      
      let query = supabase
        .from('kid_purchases')
        .select(`
          *,
          kid_profiles!inner(first_name, last_name, profile_image_url),
          kid_rewards_products!inner(title, product_image_url)
        `)
        .eq('parent_user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (kidId) {
        query = query.eq('kid_profile_id', kidId);
      }
        
      const { data, error } = await query;
        
      if (error) throw error;
      return data as unknown as KidPurchaseWithDetails[];
    },
    enabled: !!user?.id,
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });
};
