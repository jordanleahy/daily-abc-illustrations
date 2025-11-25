import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrickMediaViewerProps {
  images: string[];
  videos: string[];
  initialImageIndex?: number;
}

export function TrickMediaViewer({ images, videos, initialImageIndex = 0 }: TrickMediaViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="relative">
          <div className="w-full h-48 overflow-hidden rounded-lg bg-muted">
            <img
              src={images[currentImageIndex]}
              alt={`Trick image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-primary' : 'bg-primary/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Video Thumbnails */}
      {videos.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Videos:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {videos.map((videoUrl, index) => (
              <button
                key={index}
                onClick={() => setSelectedVideoUrl(videoUrl)}
                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
              >
                <video src={videoUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Video Player */}
      <Dialog open={!!selectedVideoUrl} onOpenChange={(open) => !open && setSelectedVideoUrl(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedVideoUrl && (
            <video
              src={selectedVideoUrl}
              controls
              autoPlay
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
