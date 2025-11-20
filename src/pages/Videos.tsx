import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VideoManagement } from '@/components/video/VideoManagement';
import { YouTubeVideoPlayer } from '@/components/video/YouTubeVideoPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function Videos() {
  const [selectedKid, setSelectedKid] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<string>('');

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
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Video Time</h1>

      <VideoManagement />

      <Card>
        <CardHeader>
          <CardTitle>Watch Videos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
