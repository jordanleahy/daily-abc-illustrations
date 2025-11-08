import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

export const useDailyPublishedQueue = () => {
  const queryClient = useQueryClient();
  
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  // Real-time subscription for daily_published changes (schedule updates)
  useEffect(() => {
    const channel = supabase
      .channel('daily-published-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_published',
        },
        (payload) => {
          console.log('Daily published changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
          queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return useQuery({
    queryKey: ['daily-published-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            book_name,
            book_description,
            user_id,
            created_at
          )
        `)
        .neq('status', 'draft') // Filter out draft entries from public queue view
        .order('created_at', { ascending: false }); // Most recently created first

      if (error) {
        console.error('Error fetching daily published queue:', error);
        throw error;
      }

      return (data as DailyPublishedWithBook[]) || [];
    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for queue
    gcTime: 60 * 1000, // 1 minute
  });
};