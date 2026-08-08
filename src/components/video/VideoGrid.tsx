import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import { VideoEmptyState } from "./VideoEmptyState";
import { useScreenTime } from "@/contexts/ScreenTimeContext";
import { useActiveYouTubeChannels, callYouTubeFunction } from "@/hooks/useYouTubeChannels";
import { formatDuration } from "@/utils/timeUtils";
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
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const { isExpired, hasTime, requestMoreTime, setWatching } = useScreenTime();

  // Hard-stop playback the moment screen time runs out
  useEffect(() => {
    if (isExpired) setPlayingVideoId(null);
  }, [isExpired]);

  // Screen time is only consumed while a video is actually playing
  useEffect(() => {
    setWatching(!!playingVideoId);
    return () => setWatching(false);
  }, [playingVideoId, setWatching]);

  // Get approved channels from database
  const { data: approvedChannels, isLoading: isLoadingChannels } = useActiveYouTubeChannels();

  // Phase 1: Get cached video list as placeholder data for instant display
  const cachedVideos = getCachedVideoList();

  const { data: videos, isLoading: isLoadingVideos } = useQuery({
    queryKey: ['youtube-videos', approvedChannels?.map(c => c.channel_id).join(',')],
    queryFn: async () => {
      if (!approvedChannels || approvedChannels.length === 0) {
        return [];
      }

      // Fetch videos from approved channels only
      const allVideos: Video[] = [];

      for (const channel of approvedChannels) {
        try {
          const data = await callYouTubeFunction(
            `action=get-channel-videos&channelId=${channel.channel_id}`
          );
          // Take up to 6 videos per channel
          allVideos.push(...(data.videos as Video[]).slice(0, 6));
        } catch (error) {
          console.error(`Failed to fetch videos for channel ${channel.channel_id}:`, error);
        }
      }

      // Shuffle videos for variety
      const shuffled = allVideos.sort(() => Math.random() - 0.5);

      // Phase 1: Save to LocalStorage cache
      saveVideoListToCache(shuffled);

      // Phase 1: Prefetch thumbnails in background
      prefetchThumbnailsToCache(shuffled.map(v => v.thumbnailUrl)).catch(console.error);

      // Phase 4: Check storage quota and cleanup if needed
      performStorageCleanupIfNeeded().catch(console.error);

      return shuffled;
    },
    enabled: !!approvedChannels && approvedChannels.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    // Phase 1: Use cached data as placeholder for instant display
    placeholderData: cachedVideos || undefined,
  });

  const handleVideoClick = (video: Video) => {
    // Block playback when screen time is exhausted (or was never granted)
    if (!hasTime) {
      requestMoreTime();
      return;
    }
    // Track video access for LRU eviction
    trackVideoAccess(video.videoId);
    setPlayingVideoId(video.videoId);
  };

  if (isLoadingChannels || isLoadingVideos) {
    return <LoadingState text="Loading videos..." />;
  }

  // Show empty state if no approved channels or no videos available
  if (!approvedChannels?.length || !videos?.length) {
    return <VideoEmptyState />;
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
