import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrickMediaUpload } from '@/types/trickMedia';

export function useTrickMediaUploads(trickId: string, kidProfileId?: string) {
  return useQuery({
    queryKey: ['trick-media-uploads', trickId, kidProfileId],
    queryFn: async () => {
      let query = supabase
        .from('trick_media_uploads')
        .select('*')
        .eq('trick_id', trickId)
        .order('uploaded_at', { ascending: false });

      if (kidProfileId) {
        query = query.eq('kid_profile_id', kidProfileId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrickMediaUpload[];
    },
  });
}
