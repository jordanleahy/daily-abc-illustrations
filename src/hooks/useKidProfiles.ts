import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface KidProfile {
  id: string;
  parent_user_id: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  is_active: boolean;
  earned_coins: number;
  created_at: string;
  updated_at: string;
}

export const useKidProfiles = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  // Base query to fetch kid profiles (includes earned_coins)
  const query = useQuery({
    queryKey: ['kid-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('kid_profiles')
        .select('*')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data as KidProfile[];
    },
    enabled: !!user?.id,
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches (realtime handles updates)
  });

  // Realtime subscription to keep coin totals fresh across devices
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('kid-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kid_profiles',
          filter: `parent_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kid-profiles', user.id] });
          queryClient.invalidateQueries({ queryKey: ['kid-coins'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};