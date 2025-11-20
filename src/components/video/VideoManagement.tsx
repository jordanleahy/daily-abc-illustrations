import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Video } from 'lucide-react';

export const VideoManagement = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['video-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Get video metadata from YouTube
      const { data: metadataResponse, error: metadataError } = await supabase.functions.invoke(
        'youtube-video',
        {
          body: { videoId },
        }
      );

      if (metadataError) throw metadataError;
      if (!metadataResponse?.success) throw new Error('Failed to fetch video metadata');

      const metadata = metadataResponse.data;

      // Insert video into database
      const { error: insertError } = await supabase.from('video_content').insert({
        parent_user_id: userData.user.id,
        youtube_video_id: videoId,
        title: metadata.title,
        description: metadata.description,
        thumbnail_url: metadata.thumbnailUrl,
        duration_seconds: metadata.durationSeconds,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-content'] });
      setYoutubeUrl('');
      setIsAdding(false);
      toast({
        title: 'Success',
        description: 'Video added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add video',
        variant: 'destructive',
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('video_content')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-content'] });
      toast({
        title: 'Success',
        description: 'Video removed successfully',
      });
    },
  });

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const handleAddVideo = () => {
    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube URL or video ID',
        variant: 'destructive',
      });
      return;
    }

    addVideoMutation.mutate(videoId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAdding ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter YouTube URL or Video ID"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddVideo()}
              />
              <Button onClick={handleAddVideo} disabled={addVideoMutation.isPending}>
                Add
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          )}

          <div className="mt-6 space-y-4">
            {isLoading && <p>Loading videos...</p>}
            
            {videos?.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <img
                  src={video.thumbnail_url || ''}
                  alt={video.title}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteVideoMutation.mutate(video.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
