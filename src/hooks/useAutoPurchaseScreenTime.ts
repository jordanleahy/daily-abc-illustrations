import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AutoPurchaseParams {
  kidId: string;
  requiredSeconds: number;
}

interface AutoPurchaseResult {
  success: boolean;
  message?: string;
  error?: string;
  coins_spent?: number;
  seconds_added?: number;
  new_screen_time_balance?: number;
  products_purchased?: number;
  kid_name?: string;
}

export const useAutoPurchaseScreenTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kidId, requiredSeconds }: AutoPurchaseParams): Promise<AutoPurchaseResult> => {
      const { data, error } = await supabase.rpc('auto_purchase_screen_time', {
        p_kid_id: kidId,
        p_required_seconds: requiredSeconds
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned from auto purchase');
      
      return data as unknown as AutoPurchaseResult;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['kid-screen-time'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['kid-purchases'] });
      
      // Show success toast if coins were spent
      if (data.coins_spent && data.coins_spent > 0) {
        const minutes = Math.floor((data.seconds_added || 0) / 60);
        toast({
          title: '🎉 Screen Time Added!',
          description: `Purchased ${minutes} minutes for ${data.coins_spent} coins`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Auto-purchase failed:', error);
      toast({
        title: 'Purchase Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
};
