import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';

interface YouTubeVideoPlayerProps {
  videoId: string;
  kidProfileId: string;
  videoContentId: string;
  onTimeExpired?: () => void;
}

export const YouTubeVideoPlayer = ({
  videoId,
  kidProfileId,
  videoContentId,
  onTimeExpired,
}: YouTubeVideoPlayerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<any>(null);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load remaining time on mount
  useEffect(() => {
    loadRemainingTime();
  }, [kidProfileId]);

  const loadRemainingTime = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('youtube-video', {
        body: null,
        method: 'GET',
      });

      if (error) throw error;

      if (data?.success) {
        setRemainingSeconds(data.data.remainingSeconds);
      }
    } catch (error) {
      console.error('Error loading remaining time:', error);
      toast({
        title: 'Error',
        description: 'Failed to load remaining video time',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize YouTube Player
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onStateChange: handlePlayerStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const handlePlayerStateChange = (event: any) => {
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) {
      startWatchTracking();
    } else {
      stopWatchTracking();
    }
  };

  const startWatchTracking = () => {
    if (watchIntervalRef.current) return;

    watchIntervalRef.current = setInterval(async () => {
      if (remainingSeconds <= 0) {
        stopVideo();
        toast({
          title: 'Time\'s Up!',
          description: 'You\'ve reached your daily video time limit.',
          variant: 'destructive',
        });
        onTimeExpired?.();
        return;
      }

      // Track 1 second of watch time
      try {
        const { data, error } = await supabase.functions.invoke('youtube-video', {
          body: {
            kidProfileId,
            videoContentId,
            secondsWatched: 1,
          },
        });

        if (error) throw error;

        if (data?.success) {
          setRemainingSeconds(data.data.remainingSeconds);
        }
      } catch (error) {
        console.error('Error tracking watch time:', error);
      }
    }, 1000);
  };

  const stopWatchTracking = () => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
  };

  const stopVideo = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    stopWatchTracking();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (remainingSeconds <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
        <Clock className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold">Daily video time limit reached</p>
        <p className="text-sm text-muted-foreground">Come back tomorrow for more videos!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Time Remaining Today</span>
          <span className="text-sm font-bold">{formatTime(remainingSeconds)}</span>
        </div>
        <Progress value={(remainingSeconds / 1800) * 100} className="h-2" />
      </div>
      
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div id="youtube-player" className="w-full h-full"></div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
