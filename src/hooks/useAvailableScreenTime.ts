import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AvailableScreenTime {
  currentBalance: number;
  availableCoins: number;
  purchasableSeconds: number;
  totalAvailableSeconds: number;
  productPrice: number;
  secondsPerProduct: number;
}

/**
 * Calculate total available screen time including what can be purchased with coins
 */
export const useAvailableScreenTime = (kidId: string) => {
  return useQuery({
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
        };
      }

      // Calculate how much screen time can be purchased
      const secondsPerProduct = product.screen_time_minutes * 60;
      const productPrice = product.coin_price;
      const affordableProducts = Math.floor(availableCoins / productPrice);
      const purchasableSeconds = affordableProducts * secondsPerProduct;
      const totalAvailableSeconds = currentBalance + purchasableSeconds;

      return {
        currentBalance,
        availableCoins,
        purchasableSeconds,
        totalAvailableSeconds,
        productPrice,
        secondsPerProduct,
      };
    },
    enabled: !!kidId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};
