/**
 * VideoAspectBadges - Video generation/link badges for book videos
 * 
 * Shows 3 aspect ratio badges (1:1, 16:9, 9:16) that either:
 * - Trigger video generation if video doesn't exist
 * - Link to existing video if it exists
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Video, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookVideos, VideoAspectRatio } from '@/hooks/useBookVideos';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { generateBookVideo, downloadBookVideo, type BookVideoProgress } from '@/services/bookVideoGenerator';
import { BookVideoProgressModal } from '@/components/exports/BookVideoProgressModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Page } from '@/types/book';

interface VideoAspectBadgesProps {
  bookId: string;
  bookName: string;
}

interface AspectConfig {
  ratio: VideoAspectRatio;
  label: string;
}

const ASPECT_CONFIGS: AspectConfig[] = [
  { ratio: 'square', label: '1:1' },
  { ratio: 'landscape', label: '16:9' },
  { ratio: 'portrait', label: '9:16' },
];

interface ActiveGeneration {
  ratio: VideoAspectRatio;
  progress: BookVideoProgress | null;
}

export function VideoAspectBadges({ bookId, bookName }: VideoAspectBadgesProps) {
  const { videos, isLoading, refetch } = useBookVideos(bookId);
  const { pages } = useBookPages(bookId);
  const { data: bookPageData } = useBookPageImages(bookId);
  const imageMap = bookPageData?.images ?? {};

  // Track active generation with full progress for modal
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null);
  
  // Cancellation flag ref
  const cancelledRef = useRef(false);

  // Browser navigation warning when generation is in progress
  useEffect(() => {
    const isGenerating = activeGeneration?.progress && 
      !['complete', 'cancelled', 'error'].includes(activeGeneration.progress.phase);
    
    if (isGenerating) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Video generation is in progress. Are you sure you want to leave?';
        return e.returnValue;
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [activeGeneration]);

  // Check if a video exists for a given aspect ratio
  const getExistingVideo = useCallback((ratio: VideoAspectRatio) => {
    return videos.find(v => v.aspectRatio === ratio);
  }, [videos]);

  // Get image URL for a page
  const getImageUrl = useCallback((page: Page): string | undefined => {
    return imageMap[page.page_number];
  }, [imageMap]);

  // Handle cancellation
  const handleCancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    setActiveGeneration(prev => prev ? {
      ...prev,
      progress: {
        phase: 'cancelled',
        currentPage: prev.progress?.currentPage ?? 0,
        totalPages: prev.progress?.totalPages ?? 0,
        pageProgress: prev.progress?.pageProgress ?? 0,
        overallProgress: prev.progress?.overallProgress ?? 0,
      }
    } : null);
  }, []);

  // Handle closing modal
  const handleCloseModal = useCallback(() => {
    setActiveGeneration(null);
    cancelledRef.current = false;
  }, []);

  // Handle video generation
  const handleGenerate = useCallback(async (ratio: VideoAspectRatio) => {
    if (!pages || pages.length === 0) {
      toast.error('No pages found for this book');
      return;
    }

    // Check if all pages have images
    const pagesWithoutImages = pages.filter(p => p.page_type !== 'cover' && !imageMap[p.page_number]);
    if (pagesWithoutImages.length > 0) {
      toast.error(`${pagesWithoutImages.length} pages are missing images`);
      return;
    }

    // Reset cancellation flag
    cancelledRef.current = false;

    // Set active generation with initial progress
    setActiveGeneration({
      ratio,
      progress: {
        phase: 'preparing',
        currentPage: 0,
        totalPages: pages.filter(p => p.page_type !== 'cover').length,
        pageProgress: 0,
        overallProgress: 0,
      }
    });

    try {
      const result = await generateBookVideo({
        bookId,
        bookName,
        pages,
        getImageUrl,
        aspectRatio: ratio,
        onProgress: (progress: BookVideoProgress) => {
          // Check if cancelled
          if (cancelledRef.current) {
            throw new Error('Generation cancelled by user');
          }
          
          setActiveGeneration(prev => prev ? {
            ...prev,
            progress,
          } : null);
        },
      });

      // Check if cancelled before download
      if (cancelledRef.current) {
        throw new Error('Generation cancelled by user');
      }

      await downloadBookVideo(result, bookName, ratio, bookId);
      
      // Update to complete state
      setActiveGeneration(prev => prev ? {
        ...prev,
        progress: {
          phase: 'complete',
          currentPage: prev.progress?.totalPages ?? 0,
          totalPages: prev.progress?.totalPages ?? 0,
          pageProgress: 100,
          overallProgress: 100,
        }
      } : null);
      
      toast.success(`Video saved to cloud!`);
      
      // Refetch to update the video list
      refetch();
    } catch (error) {
      console.error('Video generation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
      const isCancelled = errorMessage.includes('cancelled');
      
      if (!isCancelled) {
        setActiveGeneration(prev => prev ? {
          ...prev,
          progress: {
            phase: 'error',
            currentPage: prev.progress?.currentPage ?? 0,
            totalPages: prev.progress?.totalPages ?? 0,
            pageProgress: prev.progress?.pageProgress ?? 0,
            overallProgress: prev.progress?.overallProgress ?? 0,
            error: errorMessage,
          }
        } : null);
        toast.error('Failed to generate video');
      }
    }
  }, [pages, imageMap, bookId, bookName, getImageUrl, refetch]);

  // Handle opening video in new tab
  const handleOpenVideo = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  // Check if any generation is in progress (for badge display)
  const isAnyGenerating = activeGeneration !== null && 
    activeGeneration.progress?.phase !== 'complete' &&
    activeGeneration.progress?.phase !== 'cancelled' &&
    activeGeneration.progress?.phase !== 'error';

  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2 pt-1">
        {ASPECT_CONFIGS.map(({ ratio, label }) => {
          const existingVideo = getExistingVideo(ratio);
          const isGenerating = activeGeneration?.ratio === ratio && isAnyGenerating;
          const progress = activeGeneration?.ratio === ratio ? activeGeneration.progress : null;

          // Video exists - show as link
          if (existingVideo && !isGenerating) {
            return (
              <Button
                key={ratio}
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs gap-1 transition-all",
                  "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleOpenVideo(existingVideo.publicUrl);
                }}
                title={`Open ${label} video`}
              >
                <Video className="h-3 w-3" />
                {label}
                <ExternalLink className="h-2.5 w-2.5" />
              </Button>
            );
          }

          // Generating - show progress in badge
          if (isGenerating) {
            return (
              <Button
                key={ratio}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                disabled
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                {label}
                <span className="text-[10px]">{Math.round(progress?.overallProgress ?? 0)}%</span>
              </Button>
            );
          }

          // Not generated - show generate button
          return (
            <Button
              key={ratio}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleGenerate(ratio);
              }}
              title={`Generate ${label} video`}
              disabled={isAnyGenerating}
            >
              <Video className="h-3 w-3" />
              {label}
            </Button>
          );
        })}
      </div>

      {/* Progress Modal */}
      <BookVideoProgressModal
        isOpen={activeGeneration !== null}
        onClose={handleCloseModal}
        onCancel={handleCancelGeneration}
        progress={activeGeneration?.progress ?? null}
      />
    </>
  );
}
