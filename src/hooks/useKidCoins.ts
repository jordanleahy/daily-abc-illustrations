import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useKidCoins = (kidId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get coin balance for a specific kid
  const { data: kidCoins, isLoading } = useQuery({
    queryKey: ['kid-coins', kidId],
    queryFn: async () => {
      if (!user?.id || !kidId) throw new Error('User not authenticated or kid not specified');
      
      const { data, error } = await supabase
        .from('kid_profiles')
        .select('earned_coins')
        .eq('id', kidId)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();
        
      if (error) throw error;
      return data?.earned_coins || 0;
    },
    enabled: !!user?.id && !!kidId,
  });

  // Add coins to a kid's balance
  const addCoinsMutation = useMutation({
    mutationFn: async ({ kidId, coinsToAdd }: { kidId: string; coinsToAdd: number }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (coinsToAdd <= 0) throw new Error('Coins to add must be positive');
      
      // Fetch current balance
      const { data: kidData, error: fetchError } = await supabase
        .from('kid_profiles')
        .select('earned_coins')
        .eq('id', kidId)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newBalance = (kidData?.earned_coins || 0) + coinsToAdd;
      
      // Update with new balance
      const { data, error } = await supabase
        .from('kid_profiles')
        .update({ earned_coins: newBalance })
        .eq('id', kidId)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .select('earned_coins')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Coins Added!",
        description: "Great job reading!",
      });
      queryClient.invalidateQueries({ queryKey: ['kid-coins'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add coins. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to add coins:', error);
    },
  });

  return {
    kidCoins,
    isLoading,
    addCoins: addCoinsMutation.mutate,
    isAddingCoins: addCoinsMutation.isPending,
  };
};