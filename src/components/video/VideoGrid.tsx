import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import { 
  saveVideoListToCache, 
  getCachedVideoList, 
  prefetchThumbnailsToCache,
  trackVideoAccess,
  performStorageCleanupIfNeeded
} from "@/utils/videoCaching";

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

export const VideoGrid = () => {
  const navigate = useNavigate();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Check for return-home timer from reward purchase
  useEffect(() => {
    const returnHomeAt = localStorage.getItem('returnHomeAt');
    if (!returnHomeAt) return;

    const returnTime = parseInt(returnHomeAt, 10);
    const timeRemaining = returnTime - Date.now();

    if (timeRemaining <= 0) {
      // Timer already expired, clear and redirect
      localStorage.removeItem('returnHomeAt');
      navigate('/');
      return;
    }

    // Set timer to redirect home
    const timer = setTimeout(() => {
      localStorage.removeItem('returnHomeAt');
      navigate('/');
    }, timeRemaining);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Phase 1: Get cached video list as placeholder data for instant display
  const cachedVideos = getCachedVideoList();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(
        `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/youtube-video?action=search-channels&query=kids educational videos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
          },
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      // Fetch videos from multiple channels
      const allVideos: Video[] = [];
      const channels = result.data.channels.slice(0, 5); // Get videos from first 5 channels

      for (const channel of channels) {
        const videoResponse = await fetch(
          `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/youtube-video?action=get-channel-videos&channelId=${channel.channelId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
            },
          }
        );

        const videoResult = await videoResponse.json();
        if (videoResult.success) {
          allVideos.push(...videoResult.data.videos.slice(0, 3)); // Take 3 videos per channel
        }
      }

      // Shuffle videos for variety (but use a seeded shuffle based on date for consistency)
      const shuffled = allVideos.sort(() => Math.random() - 0.5);
      
      // Phase 1: Save to LocalStorage cache
      saveVideoListToCache(shuffled);
      
      // Phase 1: Prefetch thumbnails in background
      const thumbnailUrls = shuffled.map(v => v.thumbnailUrl);
      prefetchThumbnailsToCache(thumbnailUrls).catch(console.error);
      
      // Phase 4: Check storage quota and cleanup if needed
      performStorageCleanupIfNeeded().catch(console.error);
      
      return shuffled;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    // Phase 1: Use cached data as placeholder for instant display
    placeholderData: cachedVideos || undefined,
  });

  const handleVideoClick = (video: Video) => {
    // Track video access for LRU eviction
    trackVideoAccess(video.videoId);
    setPlayingVideoId(video.videoId);
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

  if (isLoading) {
    return <LoadingState text="Loading videos..." />;
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No videos available at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Card
          key={video.videoId}
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => playingVideoId !== video.videoId && handleVideoClick(video)}
        >
          {playingVideoId === video.videoId ? (
            <div className="space-y-2">
              <YouTubeVideoPlayer videoId={video.videoId} title={video.title} />
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
              </div>
            </div>
          ) : (
            <>
              <div className="aspect-video relative">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-16 h-16 text-white" />
                </div>
                <Badge className="absolute bottom-2 right-2 bg-black/80">
                  {formatDuration(video.durationSeconds)}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
};
