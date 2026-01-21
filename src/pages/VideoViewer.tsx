/**
 * VideoViewer - Dedicated page for viewing/saving videos on iOS
 * 
 * Uses direct link approach - no blob fetching to avoid corruption
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VideoViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const videoUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Video';

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

      {/* Video container - centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-[65vh] rounded-lg"
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* Direct download link - no blob corruption */}
      <div className="p-4 pb-8 space-y-3">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-14 text-lg font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <ExternalLink className="h-5 w-5" />
          Open Video File
        </a>
        <p className="text-white/60 text-sm text-center">
          Tap "Open Video File" → Long-press the video → "Save Video"
        </p>
      </div>
    </div>
  );
}
