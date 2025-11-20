import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinCounter } from "@/components/ui/coin-counter";
import { Clock } from "lucide-react";
import { formatCoinsAsCurrency } from "@/utils/currency";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";
import { useKidScreenTime } from "@/hooks/useKidScreenTime";
import { useConsumeScreenTime } from "@/hooks/useConsumeScreenTime";
import { useAvailableScreenTime } from "@/hooks/useAvailableScreenTime";
import { useAutoPurchaseScreenTime } from "@/hooks/useAutoPurchaseScreenTime";
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
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
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

  const handleVideoClick = (video: Video) => {
    const currentBalance = screenTimeBalance || 0;
    const totalAvailable = availableScreenTime?.totalAvailableSeconds || 0;
    
    // Check if they have any way to watch (either balance or purchasable time)
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
      {/* Screen Time Balance Display */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">Available Screen Time:</span>
            </div>
            {availableScreenTime && availableScreenTime.purchasableSeconds > 0 && (
              <span className="text-xs text-muted-foreground ml-7">
                Balance: {formatTimeRemaining(availableScreenTime.currentBalance)} 
                {' + '}
                {formatTimeRemaining(availableScreenTime.purchasableSeconds)} purchasable with coins
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-primary">
            {formatTimeRemaining(availableScreenTime?.totalAvailableSeconds || screenTimeBalance)}
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
      <AlertDialog open={purchaseModal.show}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              {purchaseModal.needsPurchase ? 'Confirm Purchase' : '▶️ Watch Video?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {purchaseModal.video && (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">{purchaseModal.video.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(purchaseModal.video.durationSeconds)}
                  </p>
                </div>
              )}
            
            {purchaseModal.needsPurchase ? (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Cost:</span>
                    <div className="flex items-center gap-2">
                      <CoinCounter coins={purchaseModal.coinsNeeded} size="sm" showLabel={false} />
                      <span className="text-muted-foreground">
                        ({formatCoinsAsCurrency(purchaseModal.coinsNeeded)})
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Your Balance:</span>
                    <CoinCounter coins={availableScreenTime?.availableCoins || 0} size="sm" showLabel={false} />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">After Purchase:</span>
                    <CoinCounter 
                      coins={(availableScreenTime?.availableCoins || 0) - purchaseModal.coinsNeeded} 
                      size="sm" 
                      showLabel={false} 
                    />
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This will purchase {purchaseModal.minutesNeeded} minutes of screen time to watch this video.
                </p>
              </>
            ) : (
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm">
                  ✨ You have enough screen time to watch this video!
                </p>
              </div>
            )}
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
              {purchaseModal.needsPurchase ? '🛒 Purchase & Watch' : '▶️ Watch Now'}
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
              {availableScreenTime && availableScreenTime.availableCoins > 0 
                ? `You don't have enough coins to purchase screen time. Earn ${availableScreenTime.productPrice} coins to unlock more videos!`
                : "You don't have any screen time or coins available. Complete habits to earn coins and unlock screen time!"
              }
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
