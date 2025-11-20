import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
}

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

interface ChannelVideosListProps {
  channel: Channel;
}

export const ChannelVideosList = ({ channel }: ChannelVideosListProps) => {
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['channel-videos', channel.channelId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-video?action=get-channel-videos&channelId=${channel.channelId}&maxResults=12`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.data.videos as Video[];
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async (video: Video) => {
      // First get metadata
      const { data: metadataResponse, error: metadataError } = await supabase.functions.invoke('youtube-video', {
        body: { videoId: video.videoId },
      });

      if (metadataError) throw metadataError;
      if (!metadataResponse?.success) throw new Error(metadataResponse?.error || 'Failed to get metadata');

      const metadata = metadataResponse.data;

      // Insert into video_content
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('video_content')
        .insert({
          parent_user_id: user.id,
          youtube_video_id: metadata.videoId,
          title: metadata.title,
          description: metadata.description,
          thumbnail_url: metadata.thumbnailUrl,
          duration_seconds: metadata.durationSeconds,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-videos'] });
      toast.success('Video added to library');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add video: ${error.message}`);
    },
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <img 
              src={channel.thumbnailUrl} 
              alt={channel.title}
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <CardTitle>{channel.title}</CardTitle>
              <CardDescription className="mt-2">{channel.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading videos...
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.videoId} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.durationSeconds)}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => addVideoMutation.mutate(video)}
                  disabled={addVideoMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Library
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {videos && videos.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          No videos found for this channel.
        </div>
      )}
    </div>
  );
};
