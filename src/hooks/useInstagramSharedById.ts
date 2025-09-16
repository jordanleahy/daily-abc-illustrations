import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InstagramShared } from '@/types/instagramShared';

export const useInstagramSharedById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['instagram-shared', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('instagram_shared')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching instagram shared content by id:', error);
        throw error;
      }

      return data as InstagramShared | null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};