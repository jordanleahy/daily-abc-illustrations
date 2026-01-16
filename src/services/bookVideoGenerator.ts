/**
 * Book Video Generator Service
 * 
 * Generates a complete book video by:
 * 1. Processing each page sequentially using generatePageVideo
 * 2. Concatenating all page video blobs into a single video
 * 3. Providing detailed progress feedback throughout
 * 
 * Performance optimizations:
 * - Yields between pages to prevent browser freezing
 * - Prefetches next page's image and TTS while current page processes
 * - Sequential processing to manage memory (~50-100MB peak)
 */

import { generatePageVideo, downloadBlob, type VideoResult } from './pageVideoGenerator';
import type { Page } from '@/types/book';
import { isContentPage } from '@/types/book';
import { ttsRequestQueue } from '@/utils/ttsRequestQueue';

export interface BookVideoConfig {
  bookId: string;
  bookName: string;
  pages: Page[];
  getImageUrl: (page: Page) => string | undefined;
  aspectRatio: 'portrait' | 'landscape' | 'square';
  voiceId?: string;
  onProgress?: (progress: BookVideoProgress) => void;
  abortSignal?: AbortSignal;
}

export interface BookVideoProgress {
  phase: 'preparing' | 'prefetching' | 'generating' | 'concatenating' | 'complete' | 'error' | 'cancelled';
  currentPage: number;
  totalPages: number;
  currentLetter?: string;
  currentPageTitle?: string;
  pageProgress: number;      // 0-100 for current page
  overallProgress: number;   // 0-100 for entire book
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

interface PrefetchedData {
  imageUrl: string;
  image: HTMLImageElement | null;
  ttsData: TTSData | null;
  error?: string;
}

interface TTSData {
  audio_base64: string;
  wordTimings: Array<{ word: string; startTime: number; endTime: number }>;
  originalText: string;
}

const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George

/**
 * Yield to browser event loop to prevent freezing
 */
function yieldToBrowser(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Load an image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Fetch TTS audio with word timings from ElevenLabs edge function
 */
async function fetchTTSWithTimings(text: string, voiceId: string): Promise<TTSData> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        text,
        voiceId,
        withTimestamps: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get narration text from a page
 * Uses page.title (e.g., "A is for Apple") or falls back to mainConcept
 */
function getPageNarrationText(page: Page): string {
  if (page.title) {
    return page.title;
  }
  
  // Fallback to mainConcept from content if available
  const content = page.content as { mainConcept?: string } | undefined;
  if (content?.mainConcept) {
    return content.mainConcept;
  }
  
  // Last resort: use letter
  return `Letter ${page.letter}`;
}

/**
 * Prefetch image and TTS for a page
 */
async function prefetchPageData(
  page: Page,
  imageUrl: string,
  voiceId: string
): Promise<PrefetchedData> {
  const text = getPageNarrationText(page);
  
  try {
    // Load image and TTS in parallel
    const [image, ttsData] = await Promise.all([
      loadImage(imageUrl),
      ttsRequestQueue.enqueue(() => fetchTTSWithTimings(text, voiceId)),
    ]);
    
    return { imageUrl, image, ttsData };
  } catch (error) {
    console.warn(`Prefetch failed for page ${page.letter}:`, error);
    return { imageUrl, image: null, ttsData: null, error: String(error) };
  }
}

/**
 * Generate a complete book video from all pages
 */
export async function generateBookVideo(config: BookVideoConfig): Promise<VideoResult> {
  const {
    bookName,
    pages,
    getImageUrl,
    aspectRatio,
    voiceId = DEFAULT_VOICE_ID,
    onProgress,
    abortSignal,
  } = config;

  // Filter to content pages only (skip cover, educational pages, etc.)
  const contentPages = pages.filter(isContentPage);
  const totalPages = contentPages.length;

  if (totalPages === 0) {
    throw new Error('No content pages found in book');
  }

  // Track timing for estimates
  const pageTimings: number[] = [];
  let mimeType: string | null = null;

  // Preparation phase (0-5%)
  onProgress?.({
    phase: 'preparing',
    currentPage: 0,
    totalPages,
    pageProgress: 0,
    overallProgress: 2,
  });

  // Validate all pages have images
  const pageImageUrls: string[] = [];
  for (let i = 0; i < contentPages.length; i++) {
    const page = contentPages[i];
    const imageUrl = getImageUrl(page);
    
    if (!imageUrl) {
      throw new Error(`Page ${page.letter} (${page.title}) is missing an image`);
    }
    pageImageUrls.push(imageUrl);
  }

  // Yield to browser after validation
  await yieldToBrowser();

  onProgress?.({
    phase: 'prefetching',
    currentPage: 0,
    totalPages,
    pageProgress: 0,
    overallProgress: 3,
  });

  // Prefetch first 2 pages to get started
  const prefetchCache = new Map<number, Promise<PrefetchedData>>();
  const PREFETCH_AHEAD = 2;
  
  const startPrefetch = (pageIndex: number) => {
    if (pageIndex < contentPages.length && !prefetchCache.has(pageIndex)) {
      const page = contentPages[pageIndex];
      const imageUrl = pageImageUrls[pageIndex];
      prefetchCache.set(pageIndex, prefetchPageData(page, imageUrl, voiceId));
    }
  };

  // Start prefetching first few pages
  for (let i = 0; i < Math.min(PREFETCH_AHEAD, contentPages.length); i++) {
    startPrefetch(i);
  }

  onProgress?.({
    phase: 'preparing',
    currentPage: 0,
    totalPages,
    pageProgress: 0,
    overallProgress: 5,
  });

  // Generation phase (5-90%)
  const videoBlobs: Blob[] = [];
  const generationProgressRange = 85; // 5% to 90%
  const progressPerPage = generationProgressRange / totalPages;

  for (let i = 0; i < contentPages.length; i++) {
    // Check for cancellation
    if (abortSignal?.aborted) {
      onProgress?.({
        phase: 'cancelled',
        currentPage: i,
        totalPages,
        pageProgress: 0,
        overallProgress: 5 + (i * progressPerPage),
      });
      throw new Error('Video generation cancelled');
    }

    const page = contentPages[i];
    const imageUrl = pageImageUrls[i];
    const text = getPageNarrationText(page);
    const pageStartTime = Date.now();

    // Start prefetching next pages while processing current
    for (let j = i + 1; j <= i + PREFETCH_AHEAD && j < contentPages.length; j++) {
      startPrefetch(j);
    }

    onProgress?.({
      phase: 'generating',
      currentPage: i + 1,
      totalPages,
      currentLetter: page.letter,
      currentPageTitle: page.title,
      pageProgress: 0,
      overallProgress: 5 + (i * progressPerPage),
      estimatedTimeRemaining: calculateEstimatedTime(pageTimings, totalPages - i),
    });

    try {
      const result = await generatePageVideo({
        imageUrl: imageUrl!,
        text,
        aspectRatio,
        onProgress: (pageProgress) => {
          onProgress?.({
            phase: 'generating',
            currentPage: i + 1,
            totalPages,
            currentLetter: page.letter,
            currentPageTitle: page.title,
            pageProgress,
            overallProgress: 5 + (i * progressPerPage) + (pageProgress / 100 * progressPerPage),
            estimatedTimeRemaining: calculateEstimatedTime(pageTimings, totalPages - i - (pageProgress / 100)),
          });
        },
      });

      videoBlobs.push(result.blob);
      mimeType = result.mimeType;
      
      // Track timing for better estimates
      const pageTime = (Date.now() - pageStartTime) / 1000;
      pageTimings.push(pageTime);

      // Clean up prefetch cache for completed pages
      prefetchCache.delete(i);

      // Yield to browser between pages to prevent freezing
      await yieldToBrowser();

    } catch (error) {
      console.error(`Failed to generate video for page ${page.letter}:`, error);
      throw new Error(`Failed to generate video for page ${page.letter}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check for cancellation before concatenation
  if (abortSignal?.aborted) {
    throw new Error('Video generation cancelled');
  }

  // Concatenation phase (90-100%)
  onProgress?.({
    phase: 'concatenating',
    currentPage: totalPages,
    totalPages,
    pageProgress: 100,
    overallProgress: 92,
  });

  // Yield before concatenation
  await yieldToBrowser();

  // Combine all video blobs
  // For WebM format, we can concatenate the blobs directly
  const combinedBlob = new Blob(videoBlobs, { type: mimeType || 'video/webm' });

  onProgress?.({
    phase: 'complete',
    currentPage: totalPages,
    totalPages,
    pageProgress: 100,
    overallProgress: 100,
  });

  const format = mimeType?.includes('mp4') ? 'mp4' : 'webm';

  return {
    blob: combinedBlob,
    format,
    mimeType: mimeType || 'video/webm',
  };
}

/**
 * Calculate estimated time remaining based on page timings
 */
function calculateEstimatedTime(pageTimings: number[], remainingPages: number): number {
  if (pageTimings.length === 0) {
    // Default estimate: 10 seconds per page
    return remainingPages * 10;
  }
  
  // Use rolling average of last 3 pages for better accuracy
  const recentTimings = pageTimings.slice(-3);
  const avgTime = recentTimings.reduce((a, b) => a + b, 0) / recentTimings.length;
  
  return Math.round(avgTime * remainingPages);
}

/**
 * Download the generated book video
 */
export function downloadBookVideo(result: VideoResult, bookName: string, aspectRatio: string): void {
  const sanitizedName = bookName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const extension = result.format === 'mp4' ? 'mp4' : 'webm';
  const filename = `${sanitizedName}-${aspectRatio}.${extension}`;
  
  downloadBlob(result.blob, filename);
}
