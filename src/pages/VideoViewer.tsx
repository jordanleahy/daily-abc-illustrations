/**
 * VideoViewer - Dedicated page for viewing/saving videos on iOS
 * 
 * On iOS, long-pressing the video element will show "Save Video" option
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
        <h1 className="text-white font-medium truncate">{title}</h1>
      </div>

      {/* Video container - centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-[80vh] rounded-lg"
          controlsList="nodownload"
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* iOS instruction */}
      <div className="p-4 text-center">
        <p className="text-white/70 text-sm">
          📱 <strong>To save:</strong> Long-press the video above, then tap "Save Video"
        </p>
      </div>
    </div>
  );
}
