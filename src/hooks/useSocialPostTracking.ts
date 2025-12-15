import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin';

interface SocialPost {
  id: string;
  book_id: string;
  user_id: string;
  platform: SocialPlatform;
  posted_at: string;
  created_at: string;
}

export function useSocialPostTracking(bookId: string) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: postedPlatforms = [], isLoading } = useQuery({
    queryKey: ['social-posts', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_social_posts')
        .select('platform')
        .eq('book_id', bookId);

      if (error) throw error;
      return (data || []).map((p: { platform: string }) => p.platform as SocialPlatform);
    },
    enabled: !!bookId && !!user,
  });

  const markAsPosted = useMutation({
    mutationFn: async (platform: SocialPlatform) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('book_social_posts')
        .upsert({
          book_id: bookId,
          user_id: user.id,
          platform,
          posted_at: new Date().toISOString(),
        }, {
          onConflict: 'book_id,platform',
        });

      if (error) throw error;
      return platform;
    },
    onMutate: async (platform) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['social-posts', bookId] });
      const previous = queryClient.getQueryData<SocialPlatform[]>(['social-posts', bookId]);
      
      queryClient.setQueryData<SocialPlatform[]>(['social-posts', bookId], (old = []) => {
        if (old.includes(platform)) return old;
        return [...old, platform];
      });
      
      return { previous };
    },
    onError: (_err, _platform, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['social-posts', bookId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', bookId] });
    },
  });

  const unmarkAsPosted = useMutation({
    mutationFn: async (platform: SocialPlatform) => {
      const { error } = await supabase
        .from('book_social_posts')
        .delete()
        .eq('book_id', bookId)
        .eq('platform', platform);

      if (error) throw error;
      return platform;
    },
    onMutate: async (platform) => {
      await queryClient.cancelQueries({ queryKey: ['social-posts', bookId] });
      const previous = queryClient.getQueryData<SocialPlatform[]>(['social-posts', bookId]);
      
      queryClient.setQueryData<SocialPlatform[]>(['social-posts', bookId], (old = []) => {
        return old.filter(p => p !== platform);
      });
      
      return { previous };
    },
    onError: (_err, _platform, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['social-posts', bookId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', bookId] });
    },
  });

  return {
    postedPlatforms,
    isLoading,
    markAsPosted: markAsPosted.mutate,
    unmarkAsPosted: unmarkAsPosted.mutate,
    isMarking: markAsPosted.isPending,
    isUnmarking: unmarkAsPosted.isPending,
  };
}
