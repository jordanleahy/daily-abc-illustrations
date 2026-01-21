/**
 * VideoAspectBadges - Video generation/link badges for book videos
 * 
 * Shows 3 aspect ratio badges (1:1, 16:9, 9:16) that either:
 * - Trigger video generation if video doesn't exist
 * - Link to existing video if it exists
 */

import { useState, useCallback, useMemo } from 'react';
import { Video, Loader2, Check, ExternalLink, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookVideos, VideoAspectRatio } from '@/hooks/useBookVideos';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { generateBookVideo, downloadBookVideo, type BookVideoProgress } from '@/services/bookVideoGenerator';
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

  // Handle opening video in new tab
  const handleOpenVideo = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  // Method 1: Native Share API (best for iOS - shows "Save Video" in share sheet)
  const handleShareVideo = useCallback(async (url: string, label: string) => {
    try {
      const filename = `${bookName.replace(/[^a-zA-Z0-9]/g, '-')}-${label}.mp4`;
      
      // Check if native share is available
      if (navigator.share && navigator.canShare) {
        // Fetch the video as a blob first
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'video/mp4' });
        
        // Check if we can share files
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${bookName} Video`,
          });
          return;
        }
      }
      
      // Fallback: just share the URL
      if (navigator.share) {
        await navigator.share({
          title: `${bookName} Video`,
          url: url,
        });
        return;
      }
      
      // No share API, fall back to blob download
      handleBlobDownload(url, label);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error('Failed to share video');
      }
    }
  }, [bookName]);

  // Method 2: Blob download (downloads to Files app on iOS)
  const handleBlobDownload = useCallback(async (url: string, label: string) => {
    try {
      toast.info('Downloading video...');
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = `${bookName.replace(/[^a-zA-Z0-9]/g, '-')}-${label}.mp4`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success('Video downloaded! Check Files app, then save to Photos.');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download video');
    }
  }, [bookName]);

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

          // Video exists - show play + share + download buttons
          if (existingVideo && !isGenerating) {
            return (
              <div key={ratio} className="flex items-center gap-0.5">
                {/* Method 3: Open in new tab (native video player has save option) */}
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs gap-1 transition-all rounded-r-none border-r-0",
                    "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleOpenVideo(existingVideo.publicUrl);
                  }}
                  title={`Open ${label} video (long-press video to save)`}
                >
                  <Video className="h-3 w-3" />
                  {label}
                </Button>
                
                {/* Method 1: Share API (shows iOS share sheet with "Save Video") */}
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 px-1.5 transition-all rounded-none border-x-0",
                    "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleShareVideo(existingVideo.publicUrl, label);
                  }}
                  title={`Share/Save ${label} video to Photos`}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                
                {/* Method 2: Direct link (long-press on iOS Safari) */}
                <a
                  href={existingVideo.publicUrl}
                  download
                  onClick={(e) => {
                    e.stopPropagation();
                    // On tap, use blob download instead
                    e.preventDefault();
                    handleBlobDownload(existingVideo.publicUrl, label);
                  }}
                  className={cn(
                    "inline-flex items-center justify-center h-7 px-1.5 transition-all rounded-l-none rounded-r-md border",
                    "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                  )}
                  title={`Download ${label} video`}
                >
                  <Download className="h-3 w-3" />
                </a>
              </div>
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
