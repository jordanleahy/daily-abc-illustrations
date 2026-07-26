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

export interface YouTubeChannelSearchResult {
  channelId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  subscriberCount?: number | null;
  videoCount?: number | null;
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-video`;

async function callYouTubeFunction(query: string) {
  const { data: session } = await supabase.auth.getSession();
  const response = await fetch(`${FUNCTIONS_URL}?${query}`, {
    headers: {
      Authorization: `Bearer ${session.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  const result = await response.json();
  if (!result?.success) {
    throw new Error(result?.error || 'YouTube request failed');
  }
  return result.data;
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

/** Search YouTube channels by name (results cached 7 days by the edge function). */
export function useSearchYouTubeChannels(searchTerm: string) {
  const trimmed = searchTerm.trim();

  return useQuery({
    queryKey: ['youtube-channel-search', trimmed],
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const data = await callYouTubeFunction(
        `action=search-channels&query=${encodeURIComponent(trimmed)}`
      );
      return (data?.channels || []) as YouTubeChannelSearchResult[];
    },
  });
}

/** Resolves any URL / @handle / UC id into full channel info from YouTube. */
export async function resolveChannel(input: string): Promise<YouTubeChannelSearchResult> {
  const identifier = extractChannelId(input);
  if (!identifier) {
    throw new Error(`Invalid YouTube channel URL or ID: ${input}`);
  }

  const data = await callYouTubeFunction(
    `action=get-channel-info&channelId=${encodeURIComponent(identifier)}`
  );

  if (!data?.channelId) {
    throw new Error(`Could not resolve channel: ${input}`);
  }

  return data as YouTubeChannelSearchResult;
}

async function insertChannel(info: YouTubeChannelSearchResult) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('youtube_channels')
    .insert({
      parent_user_id: user.id,
      // Always store the resolved UC… id, never the raw handle/URL input
      channel_id: info.channelId,
      channel_title: info.title || 'Unknown Channel',
      channel_thumbnail_url: info.thumbnailUrl || null,
      subscriber_count: info.subscriberCount ?? null,
      video_count: info.videoCount ?? null,
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
}

export function useAddYouTubeChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelUrl: string) => {
      const info = await resolveChannel(channelUrl);
      return insertChannel(info);
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

/** Adds an already-resolved channel (from search results) directly. */
export function useAddResolvedYouTubeChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (info: YouTubeChannelSearchResult) => insertChannel(info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-channels'] });
      toast.success('Channel added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add channel');
    },
  });
}

export interface BulkAddResult {
  input: string;
  ok: boolean;
  title?: string;
  error?: string;
}

export function useBulkAddYouTubeChannels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raw: string): Promise<BulkAddResult[]> => {
      const lines = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const results: BulkAddResult[] = [];

      for (const line of lines) {
        try {
          const info = await resolveChannel(line);
          await insertChannel(info);
          results.push({ input: line, ok: true, title: info.title });
        } catch (error) {
          results.push({
            input: line,
            ok: false,
            error: error instanceof Error ? error.message : 'Failed',
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['youtube-channels'] });
      const added = results.filter((r) => r.ok).length;
      const failed = results.length - added;
      toast.success(`Added ${added} channel${added === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Bulk add failed');
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

/**
 * Normalizes user input into something the edge function can resolve.
 * Handles are returned WITH their leading "@" so the backend resolves them
 * via search instead of treating them as raw channel IDs.
 */
export function extractChannelId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Direct channel ID
  if (/^UC[\w-]{22}$/.test(value)) {
    return value;
  }

  const channelUrl = value.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (channelUrl) return channelUrl[1];

  const handleUrl = value.match(/youtube\.com\/@([\w.-]+)/);
  if (handleUrl) return `@${handleUrl[1]}`;

  const legacyUrl = value.match(/youtube\.com\/(?:c|user)\/([\w.-]+)/);
  if (legacyUrl) return `@${legacyUrl[1]}`;

  // Bare handle — keep the "@" so the backend knows to resolve it
  if (value.startsWith('@')) {
    return value;
  }

  // Plain channel name / custom slug
  if (/^[\w.\- ]+$/.test(value)) {
    return `@${value}`;
  }

  return null;
}
