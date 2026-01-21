/**
 * VideoViewer - Dedicated page for viewing/saving videos on iOS
 * 
 * Uses native share sheet with URL for iOS compatibility
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VideoViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const videoUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Video';

  const handleShare = async () => {
    if (!videoUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          url: videoUrl,
        });
      } else {
        // Fallback: copy URL
        await navigator.clipboard.writeText(videoUrl);
        toast.success('Video URL copied!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">No video URL provided</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-black/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-white font-medium truncate flex-1">{title}</h1>
      </div>

      {/* Video container - user-select-none to prevent text selection */}
      <div className="flex-1 flex items-center justify-center p-4 select-none">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-[65vh] rounded-lg pointer-events-auto"
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* Share button - uses native iOS share sheet */}
      <div className="p-4 pb-8 space-y-3">
        <Button
          onClick={handleShare}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          <Share2 className="mr-2 h-5 w-5" />
          Share Video
        </Button>
        <div className="text-white/60 text-sm text-center space-y-1">
          <p><strong>To save to Photos:</strong></p>
          <p>Tap "Share" → scroll down → tap <strong>"Open in Safari"</strong></p>
          <p>Then long-press the video → "Save Video"</p>
        </div>
      </div>
    </div>
  );
}
