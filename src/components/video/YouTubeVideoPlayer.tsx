import { useEffect, useRef } from 'react';

interface YouTubeVideoPlayerProps {
  videoId: string;
  title?: string;
}

export const YouTubeVideoPlayer = ({ videoId, title }: YouTubeVideoPlayerProps) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    console.log('[YouTube Player] Initializing with videoId:', videoId);
    
    if (!window.YT) {
      console.log('[YouTube Player] Loading YouTube IFrame API script');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      console.log('[YouTube Player] YouTube IFrame API already loaded');
    }

    const onYouTubeIframeAPIReady = () => {
      console.log('[YouTube Player] Creating player instance');
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => console.log('[YouTube Player] Player ready'),
          onError: (event: any) => console.error('[YouTube Player] Error:', event.data),
        },
      });
    };

    if (window.YT && window.YT.Player) {
      console.log('[YouTube Player] API ready, creating player immediately');
      onYouTubeIframeAPIReady();
    } else {
      console.log('[YouTube Player] Waiting for API to load');
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold">{title}</h3>
      )}
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
