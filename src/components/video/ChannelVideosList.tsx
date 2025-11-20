import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const WATCH_TIME_LIMIT = 0.5; // minutes (30 seconds)

export const ChannelVideosList = ({ channel, onVideoSelect }: ChannelVideosListProps) => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Start new timer if video is playing
    if (playingVideoId) {
      const timeoutMs = WATCH_TIME_LIMIT * 60 * 1000; // Convert minutes to milliseconds
      
      timerRef.current = setTimeout(() => {
        setTimerExpired(true);
      }, timeoutMs);
    }

    // Cleanup on unmount or when playingVideoId changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [playingVideoId]);

  const handleVideoClick = (videoId: string) => {
    setPlayingVideoId(videoId);
    setTimerExpired(false);
  };

  const handleStartOver = () => {
    setTimerExpired(false);
    setPlayingVideoId(null);
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
                    <YouTubeVideoPlayer
                      videoId={video.videoId}
                    />
                  </div>
                ) : (
                  <div 
                    className="aspect-video relative cursor-pointer"
                    onClick={() => handleVideoClick(video.videoId)}
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

      <AlertDialog open={timerExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>
              Your {WATCH_TIME_LIMIT * 60}-second watch time has expired. Click "Start Over" to continue watching.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleStartOver}>
              Start Over
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
