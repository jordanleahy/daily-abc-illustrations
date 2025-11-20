import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PurchaseRewardInput {
  kidProfileId: string;
  productId: string;
}

export const usePurchaseReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kidProfileId, productId }: PurchaseRewardInput) => {
      const { data, error } = await supabase.functions.invoke('purchase-reward', {
        body: { kidProfileId, productId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Purchase failed');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kid-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-products'] });
      queryClient.invalidateQueries({ queryKey: ['kid-screen-time'] });
      
      toast({
        title: '🎉 Purchase Successful!',
        description: `${data.kidName} purchased "${data.productTitle}" for ${data.purchase.coins_spent} coins!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Purchase Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
