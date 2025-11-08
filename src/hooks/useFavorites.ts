import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserFavorite {
  id: string;
  user_id: string;
  daily_published_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to manage user favorites (heart collection)
 * Provides functionality to fetch, add, and remove favorites
 * Includes real-time subscription for instant updates across devices
 */
export const useFavorites = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time subscription for favorites changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-favorites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_favorites',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('User favorite changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['user-favorites', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Fetch all favorites for the current user
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }

      return data as UserFavorite[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (dailyPublishedId: string) => {
      if (!user?.id) {
        throw new Error('User must be logged in to favorite books');
      }

      // Check if already favorited
      const existing = favorites.find(f => f.daily_published_id === dailyPublishedId);

      if (existing) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' as const, dailyPublishedId };
      } else {
        // Add to favorites
        const { data, error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            daily_published_id: dailyPublishedId,
          })
          .select()
          .single();

        if (error) throw error;
        return { action: 'added' as const, dailyPublishedId, data };
      }
    },
    onMutate: async (dailyPublishedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-favorites', user?.id] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<UserFavorite[]>(['user-favorites', user?.id]);

      // Optimistically update
      const existing = favorites.find(f => f.daily_published_id === dailyPublishedId);
      if (existing) {
        // Remove optimistically
        queryClient.setQueryData<UserFavorite[]>(
          ['user-favorites', user?.id],
          (old = []) => old.filter(f => f.daily_published_id !== dailyPublishedId)
        );
      } else {
        // Add optimistically
        const optimisticFavorite: UserFavorite = {
          id: 'temp-' + Date.now(),
          user_id: user?.id || '',
          daily_published_id: dailyPublishedId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<UserFavorite[]>(
          ['user-favorites', user?.id],
          (old = []) => [optimisticFavorite, ...old]
        );
      }

      return { previousFavorites };
    },
    onError: (error, dailyPublishedId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['user-favorites', user?.id], context.previousFavorites);
      }
      
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
      });
    },
    onSuccess: (result) => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['user-favorites', user?.id] });

      toast({
        title: result.action === 'added' ? 'Added to favorites' : 'Removed from favorites',
        description: result.action === 'added' 
          ? 'This book has been added to your collection' 
          : 'This book has been removed from your collection',
      });
    },
  });

  // Helper function to check if a book is favorited
  const isFavorited = (dailyPublishedId: string) => {
    return favorites.some(f => f.daily_published_id === dailyPublishedId);
  };

  // Get favorite IDs as a Set for efficient lookup
  const favoriteIds = new Set(favorites.map(f => f.daily_published_id));

  return {
    favorites,
    isLoading,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isToggling: toggleFavoriteMutation.isPending,
    isFavorited,
    favoriteIds,
  };
};
