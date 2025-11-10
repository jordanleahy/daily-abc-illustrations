import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { ReadingPreferences } from '@/types/readingPreferences';

export function useReadingPreferences() {
  const queryClient = useQueryClient();

  // Fetch user's reading preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['reading-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('reading_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching reading preferences:', error);
        return null;
      }

      return data as ReadingPreferences | null;
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('reading-preferences-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reading_preferences',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Reading preferences changed:', payload);
            queryClient.invalidateQueries({ queryKey: ['reading-preferences'] });
          }
        )
        .subscribe();

      return channel;
    };

    let channelPromise = setupSubscription();

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [queryClient]);

  // Toggle overlay visibility
  const toggleOverlay = useMutation({
    mutationFn: async (pageId: string) => {
      console.log('Toggle overlay called for pageId:', pageId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('Current preferences:', preferences);
      const currentHidden = preferences?.hidden_overlay_pages || [];
      const isCurrentlyHidden = currentHidden.includes(pageId);
      
      const newHidden = isCurrentlyHidden
        ? currentHidden.filter(id => id !== pageId)
        : [...currentHidden, pageId];

      console.log('Saving new hidden pages:', newHidden);

      const { data, error } = await supabase
        .from('reading_preferences')
        .upsert({
          user_id: user.id,
          hidden_overlay_pages: newHidden,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving preference:', error);
        throw error;
      }
      console.log('Preference saved successfully:', data);
      return data;
    },
    onMutate: async (pageId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reading-preferences'] });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData<ReadingPreferences | null>(['reading-preferences']);

      // Optimistically update
      const currentHidden = previousPreferences?.hidden_overlay_pages || [];
      const isCurrentlyHidden = currentHidden.includes(pageId);
      const newHidden = isCurrentlyHidden
        ? currentHidden.filter(id => id !== pageId)
        : [...currentHidden, pageId];

      queryClient.setQueryData<ReadingPreferences | null>(['reading-preferences'], (old) => {
        if (!old) return old;
        return {
          ...old,
          hidden_overlay_pages: newHidden,
          updated_at: new Date().toISOString(),
        };
      });

      return { previousPreferences };
    },
    onError: (err, pageId, context) => {
      // Revert on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(['reading-preferences'], context.previousPreferences);
      }
      console.error('Error toggling overlay:', err);
      toast.error('Failed to save preference');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-preferences'] });
    },
  });

  // Helper function to check if a page overlay is hidden
  const isOverlayHidden = (pageId: string): boolean => {
    return preferences?.hidden_overlay_pages?.includes(pageId) ?? false;
  };

  // Get hidden pages as a Set for fast lookups
  const hiddenOverlayPages = new Set(preferences?.hidden_overlay_pages || []);

  return {
    preferences,
    isLoading,
    hiddenOverlayPages,
    isOverlayHidden,
    toggleOverlay: toggleOverlay.mutate,
    isToggling: toggleOverlay.isPending,
  };
}
