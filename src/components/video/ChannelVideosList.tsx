import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
  onVideoSelect?: (video: Video) => void;
}

export const ChannelVideosList = ({ channel, onVideoSelect }: ChannelVideosListProps) => {
  const navigate = useNavigate();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Check for return-home timer from reward purchase
  useEffect(() => {
    const returnHomeAt = localStorage.getItem('returnHomeAt');
    if (!returnHomeAt) return;

    const returnTime = parseInt(returnHomeAt, 10);
    const timeRemaining = returnTime - Date.now();

    if (timeRemaining <= 0) {
      localStorage.removeItem('returnHomeAt');
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      localStorage.removeItem('returnHomeAt');
      navigate('/');
    }, timeRemaining);

    return () => clearTimeout(timer);
  }, [navigate]);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['channel-videos', channel.channelId],
    queryFn: async () => {
      const url = `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/youtube-video?action=get-channel-videos&channelId=${channel.channelId}&maxResults=12`;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
        },
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.data.videos as Video[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  const handleVideoClick = (video: Video) => {
    setPlayingVideoId(video.videoId);
    onVideoSelect?.(video);
  };

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
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading videos...
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const isPlaying = playingVideoId === video.videoId;
            
            return (
              <Card 
                key={video.videoId} 
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {isPlaying ? (
                  <div className="aspect-video">
                    <YouTubeVideoPlayer videoId={video.videoId} />
                  </div>
                ) : (
                  <div 
                    className="aspect-video relative cursor-pointer"
                    onClick={() => handleVideoClick(video)}
                  >
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
                )}
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
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
