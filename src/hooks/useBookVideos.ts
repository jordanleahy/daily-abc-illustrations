/**
 * Hook to check for existing videos in Supabase storage for a book
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type VideoAspectRatio = 'portrait' | 'landscape' | 'square';

export interface BookVideo {
  aspectRatio: VideoAspectRatio;
  label: string; // "9:16", "16:9", "1:1"
  publicUrl: string;
  filename: string;
}

const ASPECT_RATIO_MAP: Record<string, { aspectRatio: VideoAspectRatio; label: string }> = {
  'portrait': { aspectRatio: 'portrait', label: '9:16' },
  'landscape': { aspectRatio: 'landscape', label: '16:9' },
  'square': { aspectRatio: 'square', label: '1:1' },
};

/**
 * Parse video filename to extract aspect ratio
 * Expected format: {book-name}-{aspectRatio}.{extension}
 * e.g., "my-abc-book-square.webm" -> "square"
 */
function parseAspectRatio(filename: string): VideoAspectRatio | null {
  const baseName = filename.replace(/\.(webm|mp4)$/i, '');
  
  for (const key of Object.keys(ASPECT_RATIO_MAP)) {
    if (baseName.endsWith(`-${key}`)) {
      return key as VideoAspectRatio;
    }
  }
  
  return null;
}

export function useBookVideos(bookId: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['book-videos', bookId],
    queryFn: async (): Promise<BookVideo[]> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // List files in the book's video folder
      const path = `${user.id}/${bookId}`;
      const { data: files, error } = await supabase.storage
        .from('videos')
        .list(path);

      if (error) {
        console.error('Error listing videos:', error);
        return [];
      }

      if (!files || files.length === 0) {
        return [];
      }

      // Parse files and build video list
      const videos: BookVideo[] = [];
      
      for (const file of files) {
        // Skip folders and non-video files
        if (!file.name || file.name.startsWith('.')) continue;
        
        const aspectRatio = parseAspectRatio(file.name);
        if (!aspectRatio) continue;
        
        const mapping = ASPECT_RATIO_MAP[aspectRatio];
        if (!mapping) continue;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(`${path}/${file.name}`);

        videos.push({
          aspectRatio: mapping.aspectRatio,
          label: mapping.label,
          publicUrl: urlData.publicUrl,
          filename: file.name,
        });
      }

      return videos;
    },
    enabled: !!bookId,
    staleTime: 30000, // 30 seconds
  });

  // Function to refetch after generating a video
  const refetchVideos = () => {
    queryClient.invalidateQueries({ queryKey: ['book-videos', bookId] });
  };

  return {
    videos: query.data ?? [],
    isLoading: query.isLoading,
    refetch: refetchVideos,
  };
}
