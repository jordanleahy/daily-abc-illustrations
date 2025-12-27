import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useKidPoints = (kidId?: string) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Real-time subscription for automatic updates
  useEffect(() => {
    if (!user?.id || !kidId) return;

    const channel = supabase
      .channel(`kid-points-${kidId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kid_profiles',
          filter: `id=eq.${kidId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kid-points', kidId] });
          queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, kidId, queryClient]);

  // Get point balance for a specific kid
  const { data: kidPoints, isLoading } = useQuery({
    queryKey: ['kid-points', kidId],
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

  // Add points to a kid's balance
  const addPointsMutation = useMutation({
    mutationFn: async ({ kidId, pointsToAdd }: { kidId: string; pointsToAdd: number }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (pointsToAdd <= 0) throw new Error('Points to add must be positive');
      
      // Fetch current balance
      const { data: kidData, error: fetchError } = await supabase
        .from('kid_profiles')
        .select('earned_coins')
        .eq('id', kidId)
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newBalance = (kidData?.earned_coins || 0) + pointsToAdd;
      
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
        title: "Points Added!",
        description: "Great job reading!",
      });
      queryClient.invalidateQueries({ queryKey: ['kid-points'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add points. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to add points:', error);
    },
  });

  return {
    kidPoints,
    isLoading,
    addPoints: addPointsMutation.mutate,
    isAddingPoints: addPointsMutation.isPending,
  };
};

/**
 * @deprecated Use useKidPoints instead
 */
export const useKidPennies = useKidPoints;

/**
 * @deprecated Use useKidPoints instead
 */
export const useKidCoins = useKidPoints;
