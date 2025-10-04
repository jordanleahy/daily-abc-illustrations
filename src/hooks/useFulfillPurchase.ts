import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FulfillPurchaseInput {
  purchaseId: string;
  notes?: string;
}

export const useFulfillPurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ purchaseId, notes }: FulfillPurchaseInput) => {
      const { data, error } = await supabase
        .from('kid_purchases')
        .update({
          purchase_status: 'fulfilled',
          fulfilled_at: new Date().toISOString(),
          notes,
        })
        .eq('id', purchaseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kid-purchases'] });
      toast({
        title: 'Success',
        description: 'Purchase marked as fulfilled',
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
