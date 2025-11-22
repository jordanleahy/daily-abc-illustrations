import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen } from "lucide-react";
import { PurchaseConfirmDialog } from "@/components/rewards/PurchaseConfirmDialog";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import { useKidScreenTime } from "@/hooks/useKidScreenTime";
import { useConsumeScreenTime } from "@/hooks/useConsumeScreenTime";
import { useAvailableScreenTime } from "@/hooks/useAvailableScreenTime";
import { useAutoPurchaseScreenTime } from "@/hooks/useAutoPurchaseScreenTime";
import { useLastViewedBook } from "@/hooks/useLastViewedBook";
import { useBookCoverImage } from "@/hooks/useBookCoverImage";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useNavigate } from "react-router-dom";
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
const DUNDUN_KID_ID = '1e6996b6-5e1d-450b-b875-d03e58a1da09'; // DanDan's kid profile ID

export const ChannelVideosList = ({ channel, onVideoSelect }: ChannelVideosListProps) => {
  const navigate = useNavigate();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [displayedTimeRemaining, setDisplayedTimeRemaining] = useState<number>(0);
  const [noScreenTimeModal, setNoScreenTimeModal] = useState(false);
  const [isAutoPurchasing, setIsAutoPurchasing] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState<{
    show: boolean;
    video: Video | null;
    needsPurchase: boolean;
    coinsNeeded: number;
    minutesNeeded: number;
  }>({
    show: false,
    video: null,
    needsPurchase: false,
    coinsNeeded: 0,
    minutesNeeded: 0,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: screenTimeBalance = 0 } = useKidScreenTime(DUNDUN_KID_ID);
  const { data: availableScreenTime } = useAvailableScreenTime(DUNDUN_KID_ID);
  const { mutate: consumeScreenTime } = useConsumeScreenTime();
  const { mutate: autoPurchaseScreenTime } = useAutoPurchaseScreenTime();
  
  // Fetch the last viewed book for this kid
  const { data: lastViewedBook } = useLastViewedBook(DUNDUN_KID_ID);
  
  // Fetch book cover image using the dedicated hook
  const { data: bookCoverUrl } = useBookCoverImage(lastViewedBook?.id);

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
    staleTime: 60 * 60 * 1000, // 1 hour - don't refetch for 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for a full day
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

  // Real-time countdown display
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (playingVideoId && sessionStartTime) {
      // Update displayed time every second
      intervalId = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        const remaining = Math.max(0, screenTimeBalance - elapsedSeconds);
        setDisplayedTimeRemaining(remaining);
        
        // Stop interval when time runs out
        if (remaining <= 0) {
          if (intervalId) clearInterval(intervalId);
        }
      }, 1000);
      
      // Set initial value immediately
      setDisplayedTimeRemaining(screenTimeBalance);
    } else {
      // Reset to full balance when not playing
      setDisplayedTimeRemaining(availableScreenTime?.totalAvailableSeconds || screenTimeBalance);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [playingVideoId, sessionStartTime, screenTimeBalance, availableScreenTime]);

  const handleVideoClick = (video: Video) => {
    // Option B: Check if user has minimum coins first
    if (!availableScreenTime?.hasMinimumCoins) {
      setNoScreenTimeModal(true);
      return;
    }
    
    const currentBalance = screenTimeBalance || 0;
    const totalAvailable = availableScreenTime?.totalAvailableSeconds || 0;
    
    // This check should now be redundant, but keep as safety
    if (totalAvailable <= 0) {
      setNoScreenTimeModal(true);
      return;
    }
    
    // Calculate if purchase is needed
    const needsPurchase = currentBalance < video.durationSeconds;
    
    if (needsPurchase && availableScreenTime) {
      // Calculate coins needed for this video
      const secondsNeeded = video.durationSeconds - currentBalance;
      const productsNeeded = Math.ceil(secondsNeeded / availableScreenTime.secondsPerProduct);
      const coinsNeeded = productsNeeded * availableScreenTime.productPrice;
      const minutesNeeded = productsNeeded * (availableScreenTime.secondsPerProduct / 60);
      
      // Check if user has enough coins
      if ((availableScreenTime.availableCoins || 0) < coinsNeeded) {
        setNoScreenTimeModal(true);
        return;
      }
      
      // Show purchase confirmation modal
      setPurchaseModal({
        show: true,
        video,
        needsPurchase: true,
        coinsNeeded,
        minutesNeeded,
      });
    } else {
      // They have enough balance, show confirmation
      setPurchaseModal({
        show: true,
        video,
        needsPurchase: false,
        coinsNeeded: 0,
        minutesNeeded: 0,
      });
    }
  };

  const handleConfirmWatch = async () => {
    if (!purchaseModal.video) return;
    
    const video = purchaseModal.video;
    const needsPurchase = purchaseModal.needsPurchase;
    
    setPurchaseModal({ ...purchaseModal, show: false });
    
    if (needsPurchase) {
      setIsAutoPurchasing(true);
      autoPurchaseScreenTime(
        { 
          kidId: DUNDUN_KID_ID, 
          requiredSeconds: video.durationSeconds 
        },
        {
          onSuccess: (result) => {
            setIsAutoPurchasing(false);
            if (result.success) {
              setPlayingVideoId(video.videoId);
              setSessionStartTime(Date.now());
              setTimerExpired(false);
            }
          },
          onError: () => {
            setIsAutoPurchasing(false);
            setNoScreenTimeModal(true);
          }
        }
      );
    } else {
      setPlayingVideoId(video.videoId);
      setSessionStartTime(Date.now());
      setTimerExpired(false);
    }
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
                    className={`aspect-video relative cursor-pointer ${isAutoPurchasing ? 'opacity-50' : ''}`}
                    onClick={() => !isAutoPurchasing && handleVideoClick(video)}
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
                    {isAutoPurchasing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-white text-sm font-medium">Purchasing screen time...</div>
                      </div>
                    )}
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

      {/* Purchase/Watch Confirmation Modal */}
      {purchaseModal.needsPurchase ? (
        <PurchaseConfirmDialog
          open={purchaseModal.show}
          onOpenChange={(open) => setPurchaseModal({ ...purchaseModal, show: open })}
          product={purchaseModal.video ? {
            id: purchaseModal.video.videoId,
            title: purchaseModal.video.title,
            description: `Duration: ${formatDuration(purchaseModal.video.durationSeconds)} - This will purchase ${purchaseModal.minutesNeeded} minutes of screen time`,
            coin_price: purchaseModal.coinsNeeded,
            product_image_url: purchaseModal.video.thumbnailUrl,
            screen_time_minutes: purchaseModal.minutesNeeded,
            is_active: true,
            is_system_product: true,
            parent_user_id: '',
            created_at: '',
            updated_at: '',
            quantity_available: null,
            product_video_url: null,
          } : null}
          currentCoins={availableScreenTime?.availableCoins || 0}
          onConfirm={handleConfirmWatch}
        />
      ) : (
        <AlertDialog open={purchaseModal.show && !purchaseModal.needsPurchase}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">
                ▶️ Watch Video?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  {purchaseModal.video && (
                    <div className="space-y-2">
                      <div className="text-foreground font-medium">{purchaseModal.video.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Duration: {formatDuration(purchaseModal.video.durationSeconds)}
                      </div>
                    </div>
                  )}
                
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="text-sm">
                      ✨ You have enough screen time to watch this video!
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="gap-2 sm:gap-0">
              <Button
                onClick={() => setPurchaseModal({ ...purchaseModal, show: false })}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <AlertDialogAction 
                onClick={handleConfirmWatch}
                className="flex-1 sm:flex-none"
              >
                ▶️ Watch Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* No Screen Time Available Modal */}
      <AlertDialog open={noScreenTimeModal} onOpenChange={setNoScreenTimeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {availableScreenTime?.hasMinimumCoins === false
                ? "Need More Coins to Unlock Videos"
                : "No Screen Time Available"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {availableScreenTime?.hasMinimumCoins === false ? (
                  <>
                    <p>You need at least <strong>{availableScreenTime.productPrice} coins</strong> to access videos.</p>
                    <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Current coins:</span>
                        <span className="font-medium">{availableScreenTime.availableCoins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coins needed:</span>
                        <span className="font-medium text-primary">{availableScreenTime.coinsNeeded}</span>
                      </div>
                    </div>

                    {/* Show Recommended Book Habit */}
                    {lastViewedBook && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            setNoScreenTimeModal(false);
                            navigate(`/book/${lastViewedBook.id}`);
                          }}
                          className="group"
                        >
                          {bookCoverUrl ? (
                            <AspectRatio ratio={1} className="w-32 h-32 rounded-lg overflow-hidden bg-muted shadow-md group-hover:shadow-lg transition-shadow">
                              <img 
                                src={bookCoverUrl} 
                                alt={lastViewedBook.book_name}
                                className="w-full h-full object-cover"
                              />
                            </AspectRatio>
                          ) : (
                            <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                              <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </button>
                      </div>
                    )}

                    {!lastViewedBook && (
                      <p className="text-sm mt-2">Complete habits to earn more coins!</p>
                    )}
                  </>
                ) : (
                  <p>You don't have enough screen time or coins to watch this video. Complete habits to earn more coins!</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setNoScreenTimeModal(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
