import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { CreateRewardsProductInput } from '@/types/rewardsProduct';

export const useCreateRewardsProduct = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRewardsProductInput) => {
      if (!user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('kid_rewards_products')
        .insert({
          parent_user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-products'] });
      toast({
        title: 'Success',
        description: 'Reward product created successfully',
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
