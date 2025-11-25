import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useEmblaCarousel from 'embla-carousel-react';

interface TrickMediaViewerProps {
  images: string[];
  videos: string[];
  initialImageIndex?: number;
}

export function TrickMediaViewer({ images, videos, initialImageIndex = 0 }: TrickMediaViewerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    startIndex: initialImageIndex,
    duration: 30,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentImageIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const goToPrevious = () => {
    emblaApi?.scrollPrev();
  };

  const goToNext = () => {
    emblaApi?.scrollNext();
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  const handleImageError = (index: number) => {
    setFailedImages(prev => new Set(prev).add(index));
  };

  return (
    <>
      {/* Image Gallery with Swipe Support */}
      {images.length > 0 && (
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden rounded-lg bg-muted">
            <div className="flex touch-pan-y">
              {images.map((image, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0">
                  <div className="w-full aspect-square relative">
                    {!loadedImages.has(index) && !failedImages.has(index) && (
                      <Skeleton className="absolute inset-0 w-full h-full" />
                    )}
                    {failedImages.has(index) ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-sm text-muted-foreground">Failed to load image</p>
                      </div>
                    ) : (
                      <img
                        src={image}
                        alt={`Trick image ${index + 1}`}
                        loading="eager"
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index)}
                        className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out ${
                          loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                    onClick={() => emblaApi?.scrollTo(index)}
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
              playsInline
              className="w-full h-auto"
              onError={(e) => {
                // Handle autoplay blocked by showing play button
                const video = e.currentTarget;
                video.controls = true;
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
