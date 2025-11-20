import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { RewardsProduct } from '@/types/rewardsProduct';

export const useDeleteRewardsProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: RewardsProduct) => {
      // Prevent deletion of system products
      if (product.is_system_product) {
        throw new Error('System products like Screen Time cannot be deleted. You can modify the price and minutes instead.');
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('kid_rewards_products')
        .update({ is_active: false })
        .eq('id', product.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-products'] });
      toast({
        title: 'Success',
        description: 'Product removed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
