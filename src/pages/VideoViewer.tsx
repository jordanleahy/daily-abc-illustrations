/**
 * VideoViewer - Dedicated page for viewing/saving videos
 * 
 * Provides direct download link for saving videos to device.
 * On iOS: Uses download attribute with direct file URL
 * On Desktop: Standard download
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VideoViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const videoUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Video';
  
  // Extract filename from URL or create one from title
  const getFilename = () => {
    if (videoUrl) {
      const urlParts = videoUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        return lastPart;
      }
    }
    return `${title.replace(/[^a-zA-Z0-9]/g, '-')}.webm`;
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    
    // Create a temporary anchor to trigger download
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = getFilename();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Download started!');
  };

  const handleOpenInNewTab = () => {
    if (!videoUrl) return;
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
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

      {/* Video container */}
      <div className="flex-1 flex items-center justify-center p-4 select-none">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-[60vh] rounded-lg"
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* Action buttons */}
      <div className="p-4 pb-8 space-y-3">
        <Button
          onClick={handleDownload}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          Download Video
        </Button>
        
        <Button
          onClick={handleOpenInNewTab}
          variant="outline"
          className="w-full h-12 text-white border-white/30 hover:bg-white/10"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </Button>
        
        <p className="text-white/50 text-xs text-center pt-2">
          Videos are generated in WebM format for best quality.
          <br />
          Generate videos on desktop, then view/download on any device.
        </p>
      </div>
    </div>
  );
}
