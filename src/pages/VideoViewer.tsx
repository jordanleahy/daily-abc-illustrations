/**
 * VideoViewer - Dedicated page for viewing/saving videos on iOS
 * 
 * Provides a Save button that uses the Web Share API with file sharing
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VideoViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  const videoUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Video';

  const handleSaveToPhotos = async () => {
    if (!videoUrl) return;
    
    setIsSaving(true);
    try {
      toast.info('Preparing video...');
      
      // Fetch the video
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Determine filename from URL or use title
      const urlParts = videoUrl.split('/');
      const originalFilename = urlParts[urlParts.length - 1] || 'video.mp4';
      const filename = originalFilename.includes('.') ? originalFilename : `${title.replace(/[^a-zA-Z0-9]/g, '-')}.mp4`;
      
      // Create file with video/mp4 type
      const file = new File([blob], filename, { type: blob.type || 'video/mp4' });
      
      // Try native share with file
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
        });
        toast.success('Saved!');
      } else {
        // Fallback: direct download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast.success('Video downloaded!');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled - no error
        return;
      }
      console.error('Save failed:', error);
      toast.error('Failed to save video');
    } finally {
      setIsSaving(false);
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

      {/* Video container - centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-[70vh] rounded-lg"
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* Save button */}
      <div className="p-4 pb-8">
        <Button
          onClick={handleSaveToPhotos}
          disabled={isSaving}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Save to Photos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
