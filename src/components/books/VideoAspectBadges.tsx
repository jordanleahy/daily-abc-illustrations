/**
 * VideoAspectBadges - Video generation/link badges for book videos
 * 
 * Shows 3 aspect ratio badges (1:1, 16:9, 9:16) that either:
 * - Trigger video generation if video doesn't exist
 * - Link to existing video if it exists
 * 
 * Note: Video generation only works on desktop browsers due to 
 * MediaRecorder codec limitations on iOS/Safari.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookVideos, VideoAspectRatio } from '@/hooks/useBookVideos';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { generateBookVideo, downloadBookVideo, type BookVideoProgress, isVideoGenerationSupported } from '@/services/bookVideoGenerator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Page } from '@/types/book';
import { VideoRenderingModal } from './VideoRenderingModal';

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

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  phase: string;
}

export function VideoAspectBadges({ bookId, bookName }: VideoAspectBadgesProps) {
  const navigate = useNavigate();
  const { videos, isLoading, refetch } = useBookVideos(bookId);
  const { pages } = useBookPages(bookId);
  const { data: bookPageData } = useBookPageImages(bookId);
  const imageMap = bookPageData?.images ?? {};

  // Track generation state per aspect ratio
  const [generationStates, setGenerationStates] = useState<Record<VideoAspectRatio, GenerationState>>({
    square: { isGenerating: false, progress: 0, phase: '' },
    landscape: { isGenerating: false, progress: 0, phase: '' },
    portrait: { isGenerating: false, progress: 0, phase: '' },
  });

  // Find active rendering state for modal
  const activeRendering = useMemo(() => {
    for (const config of ASPECT_CONFIGS) {
      const state = generationStates[config.ratio];
      if (state.isGenerating) {
        return { ratio: config.ratio, label: config.label, ...state };
      }
    }
    return null;
  }, [generationStates]);

  // Check if a video exists for a given aspect ratio
  const getExistingVideo = useCallback((ratio: VideoAspectRatio) => {
    return videos.find(v => v.aspectRatio === ratio);
  }, [videos]);

  // Get image URL for a page
  const getImageUrl = useCallback((page: Page): string | undefined => {
    return imageMap[page.page_number];
  }, [imageMap]);

  // Handle video generation
  const handleGenerate = useCallback(async (ratio: VideoAspectRatio) => {
    // Check browser support first
    if (!isVideoGenerationSupported()) {
      toast.error('Video generation requires a desktop browser. Please use Chrome, Firefox, or Edge on a computer.', {
        duration: 6000,
      });
      return;
    }

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

    setGenerationStates(prev => ({
      ...prev,
      [ratio]: { isGenerating: true, progress: 0, phase: 'preparing' },
    }));

    try {
      const result = await generateBookVideo({
        bookId,
        bookName,
        pages,
        getImageUrl,
        aspectRatio: ratio,
        onProgress: (progress: BookVideoProgress) => {
          setGenerationStates(prev => ({
            ...prev,
            [ratio]: {
              isGenerating: true,
              progress: progress.overallProgress,
              phase: progress.phase,
            },
          }));
        },
      });

      await downloadBookVideo(result, bookName, ratio, bookId);
      toast.success(`Video saved to cloud!`);
      
      // Refetch to update the video list
      refetch();
    } catch (error) {
      console.error('Video generation failed:', error);
      toast.error('Failed to generate video');
    } finally {
      setGenerationStates(prev => ({
        ...prev,
        [ratio]: { isGenerating: false, progress: 0, phase: '' },
      }));
    }
  }, [pages, imageMap, bookId, bookName, getImageUrl, refetch]);

  // Navigate to video viewer page for iOS-friendly saving
  const handleOpenVideo = useCallback((url: string, label: string) => {
    const params = new URLSearchParams({
      url,
      title: `${bookName} (${label})`
    });
    navigate(`/video?${params.toString()}`);
  }, [navigate, bookName]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Rendering warning modal */}
      <VideoRenderingModal
        isOpen={!!activeRendering}
        progress={activeRendering?.progress ?? 0}
        phase={activeRendering?.phase ?? ''}
        aspectLabel={activeRendering?.label ?? ''}
      />

      <div className="flex items-center justify-center gap-2 pt-1">
        {ASPECT_CONFIGS.map(({ ratio, label }) => {
          const existingVideo = getExistingVideo(ratio);
          const state = generationStates[ratio];
          const isGenerating = state.isGenerating;

          // Video exists - single Save button
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
                  handleOpenVideo(existingVideo.publicUrl, label);
                }}
                title={`Save ${label} video to Photos`}
              >
                <Save className="h-3 w-3" />
                {label}
              </Button>
            );
          }

          // Generating - show progress
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
                <span className="text-[10px]">{Math.round(state.progress)}%</span>
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
            >
              <Video className="h-3 w-3" />
              {label}
            </Button>
          );
        })}
      </div>
    </>
  );
}
