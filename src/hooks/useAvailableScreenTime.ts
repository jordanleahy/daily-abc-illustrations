import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AvailableScreenTime {
  currentBalance: number;
  availableCoins: number;
  purchasableSeconds: number;
  totalAvailableSeconds: number;
  productPrice: number;
  secondsPerProduct: number;
  hasMinimumCoins: boolean;
  coinsNeeded: number;
}

/**
 * Calculate total available screen time including what can be purchased with coins
 */
export const useAvailableScreenTime = (kidId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['available-screen-time', kidId],
    queryFn: async (): Promise<AvailableScreenTime> => {
      if (!kidId) {
        throw new Error('Kid ID is required');
      }

      // Get kid profile with current balance and coins
      const { data: kidProfile, error: kidError } = await supabase
        .from('kid_profiles')
        .select('screen_time_balance_seconds, earned_coins, parent_user_id')
        .eq('id', kidId)
        .single();

      if (kidError) throw kidError;

      const currentBalance = kidProfile.screen_time_balance_seconds || 0;
      const availableCoins = kidProfile.earned_coins || 0;

      // Get Screen Time product configuration
      const { data: product, error: productError } = await supabase
        .from('kid_rewards_products')
        .select('coin_price, screen_time_minutes')
        .eq('parent_user_id', kidProfile.parent_user_id)
        .eq('title', 'Screen Time')
        .eq('is_active', true)
        .not('screen_time_minutes', 'is', null)
        .single();

      if (productError || !product) {
        // No screen time product configured, return just current balance
        return {
          currentBalance,
          availableCoins,
          purchasableSeconds: 0,
          totalAvailableSeconds: currentBalance,
          productPrice: 0,
          secondsPerProduct: 0,
          hasMinimumCoins: true,
          coinsNeeded: 0,
        };
      }

      // Calculate how much screen time can be purchased
      const secondsPerProduct = product.screen_time_minutes * 60;
      const productPrice = product.coin_price;
      const affordableProducts = Math.floor(availableCoins / productPrice);
      const purchasableSeconds = affordableProducts * secondsPerProduct;
      
      // Option B: Screen time is only usable if user has minimum coins
      const hasMinimumCoins = availableCoins >= productPrice;
      const totalAvailableSeconds = hasMinimumCoins 
        ? currentBalance + purchasableSeconds 
        : 0;
      const coinsNeeded = hasMinimumCoins ? 0 : (productPrice - availableCoins);

      return {
        currentBalance,
        availableCoins,
        purchasableSeconds,
        totalAvailableSeconds,
        productPrice,
        secondsPerProduct,
        hasMinimumCoins,
        coinsNeeded,
      };
    },
    enabled: !!kidId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Real-time subscription for product changes
  useEffect(() => {
    if (!kidId) return;

    const channel = supabase
      .channel('screen-time-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kid_rewards_products',
        },
        () => {
          console.log('[useAvailableScreenTime] Product updated, refreshing...');
          queryClient.invalidateQueries({ queryKey: ['available-screen-time', kidId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kid_profiles',
          filter: `id=eq.${kidId}`,
        },
        () => {
          console.log('[useAvailableScreenTime] Kid profile updated, refreshing...');
          queryClient.invalidateQueries({ queryKey: ['available-screen-time', kidId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kidId, queryClient]);

  return query;
};
