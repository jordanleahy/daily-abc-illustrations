import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface YouTubeChannel {
  id: string;
  parent_user_id: string;
  channel_id: string;
  channel_title: string;
  channel_thumbnail_url: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useYouTubeChannels() {
  return useQuery({
    queryKey: ['youtube-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youtube_channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as YouTubeChannel[];
    },
  });
}

export function useActiveYouTubeChannels() {
  return useQuery({
    queryKey: ['youtube-channels', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youtube_channels')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as YouTubeChannel[];
    },
  });
}

export function useAddYouTubeChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelUrl: string) => {
      // Extract channel ID from URL or use directly
      const channelId = extractChannelId(channelUrl);
      if (!channelId) {
        throw new Error('Invalid YouTube channel URL or ID');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch channel info from YouTube API via edge function
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/youtube-video?action=get-channel-info&channelId=${channelId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
          },
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch channel info');
      }

      const channelInfo = result.data;

      // Insert into database
      const { data, error } = await supabase
        .from('youtube_channels')
        .insert({
          parent_user_id: user.id,
          channel_id: channelId,
          channel_title: channelInfo.title || 'Unknown Channel',
          channel_thumbnail_url: channelInfo.thumbnailUrl || null,
          subscriber_count: channelInfo.subscriberCount || null,
          video_count: channelInfo.videoCount || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This channel has already been added');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-channels'] });
      toast.success('Channel added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add channel');
    },
  });
}

export function useDeleteYouTubeChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase
        .from('youtube_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-channels'] });
      toast.success('Channel removed');
    },
    onError: () => {
      toast.error('Failed to remove channel');
    },
  });
}

export function useToggleYouTubeChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('youtube_channels')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-channels'] });
      toast.success('Channel updated');
    },
    onError: () => {
      toast.error('Failed to update channel');
    },
  });
}

function extractChannelId(input: string): string | null {
  // Handle direct channel ID
  if (/^UC[\w-]{22}$/.test(input)) {
    return input;
  }

  // Handle various YouTube URL formats
  const patterns = [
    /youtube\.com\/channel\/(UC[\w-]{22})/,
    /youtube\.com\/@([\w-]+)/,
    /youtube\.com\/c\/([\w-]+)/,
    /youtube\.com\/user\/([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      // For @ handles and custom URLs, we return the handle
      // The edge function will resolve it to the actual channel ID
      return match[1];
    }
  }

  // If it's just a handle without URL
  if (input.startsWith('@')) {
    return input.substring(1);
  }

  // Return as-is if it looks like a potential channel identifier
  if (/^[\w-]+$/.test(input)) {
    return input;
  }

  return null;
}
