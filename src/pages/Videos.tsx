import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { YouTubeVideoPlayer } from "@/components/video/YouTubeVideoPlayer";
import { ChannelBrowser } from "@/components/video/ChannelBrowser";
import { toast } from "sonner";

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

export default function Videos() {
  const [selectedKid, setSelectedKid] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [playingVideo, setPlayingVideo] = useState<{ videoId: string; contentId: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: kids } = useQuery({
    queryKey: ['kid-profiles'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('kid_profiles')
        .select('*')
        .eq('parent_user_id', userData.user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

  const addAndPlayVideo = useMutation({
    mutationFn: async (video: Video) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Check if video already exists
      const { data: existing } = await supabase
        .from('video_content')
        .select('id')
        .eq('youtube_video_id', video.videoId)
        .eq('parent_user_id', userData.user.id)
        .single();

      if (existing) {
        return existing.id;
      }

      // Add to library
      const { data: inserted, error } = await supabase
        .from('video_content')
        .insert({
          parent_user_id: userData.user.id,
          youtube_video_id: video.videoId,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnailUrl,
          duration_seconds: video.durationSeconds,
        })
        .select('id')
        .single();

      if (error) throw error;
      return inserted.id;
    },
    onSuccess: (contentId, video) => {
      queryClient.invalidateQueries({ queryKey: ['video-content'] });
      setPlayingVideo({ videoId: video.videoId, contentId });
      
      // Auto-select first kid if none selected
      if (!selectedKid && kids && kids.length > 0) {
        setSelectedKid(kids[0].id);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to load video: ${error.message}`);
    },
  });

  const { data: videos } = useQuery({
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

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <ChannelBrowser onVideoSelect={(video) => addAndPlayVideo.mutate(video)} />

          {playingVideo && !selectedKid && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Child to Watch Video</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedKid} onValueChange={setSelectedKid}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {kids?.map((kid) => (
                      <SelectItem key={kid.id} value={kid.id}>
                        {kid.first_name} {kid.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {playingVideo && selectedKid && (
            <Card>
              <CardHeader>
                <CardTitle>Now Playing</CardTitle>
              </CardHeader>
              <CardContent>
                <YouTubeVideoPlayer
                  videoId={playingVideo.videoId}
                  kidProfileId={selectedKid}
                  videoContentId={playingVideo.contentId}
                />
              </CardContent>
            </Card>
          )}

          {!playingVideo && (
            <Card>
              <CardHeader>
                <CardTitle>Watch Videos</CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Child</label>
                  <Select value={selectedKid} onValueChange={setSelectedKid}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {kids?.map((kid) => (
                        <SelectItem key={kid.id} value={kid.id}>
                          {kid.first_name} {kid.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Video</label>
                  <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a video" />
                    </SelectTrigger>
                    <SelectContent>
                      {videos?.map((video) => (
                        <SelectItem key={video.id} value={video.id}>
                          {video.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedKid && selectedVideo && (
                <YouTubeVideoPlayer
                  videoId={videos?.find((v) => v.id === selectedVideo)?.youtube_video_id || ''}
                  kidProfileId={selectedKid}
                  videoContentId={selectedVideo}
                />
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
