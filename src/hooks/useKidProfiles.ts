import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { SafeLocalStorage, KID_PROFILES_CACHE_KEY, KID_PROFILES_CACHE_DAYS } from '@/utils/storage';

export interface KidProfile {
  id: string;
  parent_user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  profile_image_url?: string;
  is_active: boolean;
  earned_coins: number;
  screen_time_balance_seconds: number;
  created_at: string;
  updated_at: string;
}

export const useKidProfiles = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Generate cache key including user ID for multi-user support
  const cacheKey = useMemo(() => {
    if (!user?.id) return null;
    return `${KID_PROFILES_CACHE_KEY}_${user.id}`;
  }, [user?.id]);

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
          // Clear cache to ensure fresh data on next fetch
          if (cacheKey) {
            SafeLocalStorage.remove(cacheKey);
          }
          queryClient.invalidateQueries({ queryKey: ['kid-profiles', user.id] });
          queryClient.invalidateQueries({ queryKey: ['kid-coins'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, cacheKey]);

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

      // Save to cache after successful fetch (90 days = 90 * 24 hours)
      if (cacheKey && data) {
        SafeLocalStorage.set(cacheKey, data, KID_PROFILES_CACHE_DAYS * 24);
      }

      return data as KidProfile[];
    },
    enabled: !!user?.id,
    // Use cached data as placeholder for instant display while fetching
    placeholderData: () => {
      if (!cacheKey) return undefined;
      return SafeLocalStorage.get<KidProfile[]>(cacheKey) ?? undefined;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return query;
};
