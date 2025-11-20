import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import { useKidScreenTime } from "@/hooks/useKidScreenTime";
import { useConsumeScreenTime } from "@/hooks/useConsumeScreenTime";
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

// TODO: Replace with actual kid ID from context/state management
const DUNDUN_KID_ID = 'b0792c6d-fb13-4e17-8c0f-b8c0866ab933'; // Hard-coded for MVP

export const ChannelVideosList = ({ channel, onVideoSelect }: ChannelVideosListProps) => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [noScreenTimeModal, setNoScreenTimeModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: screenTimeBalance = 0 } = useKidScreenTime(DUNDUN_KID_ID);
  const { mutate: consumeScreenTime } = useConsumeScreenTime();

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

  // Cleanup effect to consume time on unmount
  useEffect(() => {
    return () => {
      if (playingVideoId && sessionStartTime) {
        const watchedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        if (watchedSeconds > 0) {
          consumeScreenTime({
            kidId: DUNDUN_KID_ID,
            seconds: Math.min(watchedSeconds, screenTimeBalance),
            videoId: playingVideoId
          });
        }
      }
    };
  }, [playingVideoId, sessionStartTime, screenTimeBalance, consumeScreenTime]);

  // Timer effect using screen time balance
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Start new timer if video is playing and has balance
    if (playingVideoId && screenTimeBalance > 0) {
      const timeoutMs = screenTimeBalance * 1000; // Convert seconds to milliseconds
      
      timerRef.current = setTimeout(() => {
        if (sessionStartTime) {
          const watchedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
          consumeScreenTime({
            kidId: DUNDUN_KID_ID,
            seconds: Math.min(watchedSeconds, screenTimeBalance),
            videoId: playingVideoId
          });
        }
        setTimerExpired(true);
        setPlayingVideoId(null);
      }, timeoutMs);
    }

    // Cleanup on unmount or when playingVideoId changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [playingVideoId, screenTimeBalance, sessionStartTime, consumeScreenTime]);

  const handleVideoClick = (videoId: string) => {
    if (!screenTimeBalance || screenTimeBalance <= 0) {
      setNoScreenTimeModal(true);
      return;
    }
    
    setPlayingVideoId(videoId);
    setSessionStartTime(Date.now());
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

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Screen Time Balance Display */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-medium">Screen Time Remaining:</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {formatTimeRemaining(screenTimeBalance)}
          </span>
        </div>
      </div>

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

      {/* Screen Time Used Up Modal */}
      <AlertDialog open={timerExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Screen Time Used Up!</AlertDialogTitle>
            <AlertDialogDescription>
              You've used all your screen time. Purchase more screen time from the rewards store to continue watching.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleStartOver}>
              Got It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Screen Time Available Modal */}
      <AlertDialog open={noScreenTimeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No Screen Time Available</AlertDialogTitle>
            <AlertDialogDescription>
              You don't have any screen time available. Ask your parent to purchase screen time from the rewards store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setNoScreenTimeModal(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
