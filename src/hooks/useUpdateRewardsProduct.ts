import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Toast notifications removed
import type { UpdateRewardsProductInput } from '@/types/rewardsProduct';

export const useUpdateRewardsProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateRewardsProductInput }) => {
      const { data, error } = await supabase
        .from('kid_rewards_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-products'] });
      console.log('Product updated successfully');
    },
    onError: (error: Error) => {
      console.error(error.message);
    },
  });
};
