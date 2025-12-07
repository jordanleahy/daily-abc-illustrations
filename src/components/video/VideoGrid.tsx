import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import { useKidScreenTime } from "@/hooks/useKidScreenTime";
import { useAvailableScreenTime } from "@/hooks/useAvailableScreenTime";
import { useConsumeScreenTime } from "@/hooks/useConsumeScreenTime";
import { useAutoPurchaseScreenTime } from "@/hooks/useAutoPurchaseScreenTime";
import { useLastViewedBookWithCover } from "@/hooks/useLastViewedBookWithCover";
import { useKidProfiles } from "@/hooks/useKidProfiles";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PurchaseConfirmDialog } from "@/components/rewards/PurchaseConfirmDialog";
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
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [displayedTimeRemaining, setDisplayedTimeRemaining] = useState<number>(0);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showNoTimeDialog, setShowNoTimeDialog] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<Video | null>(null);

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

  const { data: kidProfiles } = useKidProfiles();
  const selectedKid = kidProfiles?.find(k => k.is_active);
  const kidId = selectedKid?.id;

  const { data: screenTime } = useKidScreenTime(kidId);
  const { data: availableTime } = useAvailableScreenTime(kidId || '');
  const consumeScreenTime = useConsumeScreenTime();
  const autoPurchase = useAutoPurchaseScreenTime();
  const { data: lastBook } = useLastViewedBookWithCover(kidId);

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

  // Consume screen time on unmount
  useEffect(() => {
    return () => {
      if (playingVideoId && sessionStartTime && kidId) {
        const secondsWatched = Math.floor((Date.now() - sessionStartTime) / 1000);
        if (secondsWatched > 0) {
          consumeScreenTime.mutate({
            kidId,
            seconds: secondsWatched,
            videoId: playingVideoId,
          });
        }
      }
    };
  }, [playingVideoId, sessionStartTime, kidId]);

  // Timer countdown logic
  useEffect(() => {
    if (!playingVideoId || !sessionStartTime) return;

    const currentBalance = screenTime || 0;
    const checkInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const remaining = currentBalance - elapsed;

      if (remaining <= 0) {
        setTimerExpired(true);
        setPlayingVideoId(null);
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [playingVideoId, sessionStartTime, screenTime]);

  // Real-time countdown display
  useEffect(() => {
    if (!playingVideoId || !sessionStartTime) return;

    const currentBalance = screenTime || 0;
    const updateDisplay = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const remaining = Math.max(0, currentBalance - elapsed);
      setDisplayedTimeRemaining(remaining);
    }, 100);

    return () => clearInterval(updateDisplay);
  }, [playingVideoId, sessionStartTime, screenTime]);

  const handleVideoClick = (video: Video) => {
    if (!kidId) return;

    // Phase 4: Track video access for LRU eviction
    trackVideoAccess(video.videoId);

    const currentBalance = screenTime || 0;
    const totalAvailable = availableTime?.totalAvailableSeconds || 0;

    if (currentBalance > 0) {
      setPlayingVideoId(video.videoId);
      setSessionStartTime(Date.now());
    } else if (totalAvailable > 0) {
      setPendingVideo(video);
      setShowPurchaseDialog(true);
    } else {
      setShowNoTimeDialog(true);
    }
  };

  const handleConfirmWatch = async () => {
    if (!pendingVideo || !kidId) return;

    const requiredSeconds = Math.max(60, Math.ceil(pendingVideo.durationSeconds * 1.1));

    try {
      await autoPurchase.mutateAsync({
        kidId,
        requiredSeconds,
      });

      setPlayingVideoId(pendingVideo.videoId);
      setSessionStartTime(Date.now());
      setShowPurchaseDialog(false);
      setPendingVideo(null);
    } catch (error) {
      console.error('Auto-purchase failed:', error);
    }
  };

  const handleStartOver = () => {
    setTimerExpired(false);
    setPlayingVideoId(null);
    setSessionStartTime(null);
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
    <>
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
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Time Remaining:</span>
                    <Badge variant="secondary" className="font-mono">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeRemaining(displayedTimeRemaining)}
                    </Badge>
                  </div>
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

      {/* Timer Expired Dialog */}
      <AlertDialog open={timerExpired} onOpenChange={setTimerExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⏰ Screen Time Complete!</AlertDialogTitle>
            <AlertDialogDescription>
              Great job watching! Your screen time for this video has ended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleStartOver}>
              Choose Another Video
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase Confirmation Dialog */}
      {showPurchaseDialog && pendingVideo && (
        <PurchaseConfirmDialog
          open={showPurchaseDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowPurchaseDialog(false);
              setPendingVideo(null);
            }
          }}
          product={{
            id: pendingVideo.videoId,
            title: pendingVideo.title,
            description: `Duration: ${formatDuration(pendingVideo.durationSeconds)} - Watch this video`,
            coin_price: availableTime?.productPrice || 0,
            product_image_url: pendingVideo.thumbnailUrl,
            screen_time_minutes: Math.ceil(pendingVideo.durationSeconds / 60),
            is_active: true,
            is_system_product: true,
            parent_user_id: '',
            created_at: '',
            updated_at: '',
            quantity_available: null,
            product_video_url: null,
          }}
          currentPennies={availableTime?.availableCoins || 0}
          onConfirm={handleConfirmWatch}
        />
      )}

      {/* No Screen Time Dialog */}
      <AlertDialog open={showNoTimeDialog} onOpenChange={setShowNoTimeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⏰ No Screen Time Available</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You don't have enough coins to watch videos right now.</p>
              {lastBook?.book_name && (
                <p className="text-sm">
                  💡 Try reading <strong>{lastBook.book_name}</strong> to earn more coins!
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoTimeDialog(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
