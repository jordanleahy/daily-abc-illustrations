/**
 * Book Video Generator Service
 * 
 * Generates a complete book video by:
 * 1. Setting up a single MediaRecorder session
 * 2. Processing each page sequentially (drawing frames + playing audio)
 * 3. Recording everything into one continuous video
 * 
 * Key: We use ONE MediaRecorder for the entire book to avoid
 * concatenation issues (video files can't be merged by joining bytes)
 */

import type { Page } from '@/types/book';
import { isContentPage } from '@/types/book';
import { ttsRequestQueue } from '@/utils/ttsRequestQueue';
import { saveAndOpenVideo, type VideoUploadResult } from './videoStorageService';
import { supabase } from '@/integrations/supabase/client';

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
  phase: 'preparing' | 'prefetching' | 'generating' | 'complete' | 'error' | 'cancelled';
  currentPage: number;
  totalPages: number;
  currentLetter?: string;
  currentPageTitle?: string;
  pageProgress: number;
  overallProgress: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

export interface VideoResult {
  blob: Blob;
  format: 'mp4' | 'webm';
  mimeType: string;
}

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface TTSData {
  audio_base64: string;
  wordTimings: WordTiming[];
  originalText: string;
}

interface PageData {
  page: Page;
  imageUrl: string;
  image: HTMLImageElement;
  text: string;
  ttsData: TTSData;
  audioBuffer: AudioBuffer;
}

const DIMENSIONS = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

const DEFAULT_VOICE_ID = 'XrExE9yKIg1WjnnlVkGX'; // Matilda - warm, nurturing voice for toddlers

function yieldToBrowser(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function isIOSOrSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || isSafari;
}

function getBestMimeType(): { mimeType: string; format: 'mp4' | 'webm' } {
  if (isIOSOrSafari()) {
    const mp4Types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1.4d002a',
      'video/mp4',
    ];
    for (const type of mp4Types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type, format: 'mp4' };
      }
    }
  }
  
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    return { mimeType: 'video/webm;codecs=vp9,opus', format: 'webm' };
  }
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    return { mimeType: 'video/webm;codecs=vp8,opus', format: 'webm' };
  }
  return { mimeType: 'video/webm', format: 'webm' };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

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

async function base64ToAudioBuffer(
  base64: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return audioContext.decodeAudioData(bytes.buffer);
}

function getPageNarrationText(page: Page): string {
  if (page.title) {
    return page.title;
  }
  const content = page.content as { mainConcept?: string } | undefined;
  if (content?.mainConcept) {
    return content.mainConcept;
  }
  return `Letter ${page.letter}`;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  words: string[],
  wordTimings: WordTiming[],
  currentTime: number
) {
  const { width, height } = ctx.canvas;

  // Clear canvas with a blurred background
  ctx.clearRect(0, 0, width, height);

  // Draw background image using CONTAIN logic (show full image, centered)
  const imgRatio = image.width / image.height;
  const canvasRatio = width / height;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  // First, draw a blurred/darkened version as background to fill empty space
  ctx.save();
  ctx.filter = 'blur(30px) brightness(0.4)';
  // Draw cover version for background blur
  if (imgRatio > canvasRatio) {
    const bgHeight = height;
    const bgWidth = height * imgRatio;
    ctx.drawImage(image, (width - bgWidth) / 2, 0, bgWidth, bgHeight);
  } else {
    const bgWidth = width;
    const bgHeight = width / imgRatio;
    ctx.drawImage(image, 0, (height - bgHeight) / 2, bgWidth, bgHeight);
  }
  ctx.restore();
  
  // Now draw the main image using CONTAIN (fit entirely within canvas)
  if (imgRatio > canvasRatio) {
    // Image is wider than canvas - fit by width
    drawWidth = width;
    drawHeight = width / imgRatio;
    drawX = 0;
    drawY = (height - drawHeight) / 2;
  } else {
    // Image is taller/square - fit by height
    drawHeight = height;
    drawWidth = height * imgRatio;
    drawX = (width - drawWidth) / 2;
    drawY = 0;
  }
  
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const safePadding = Math.max(16, Math.round(width * 0.03));
  const barHeight = Math.round(height * 0.1);
  const barY = height - barHeight - safePadding;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(safePadding, barY, width - safePadding * 2, barHeight);

  // Find current word index
  let currentWordIndex = -1;
  for (let i = 0; i < wordTimings.length; i++) {
    if (currentTime >= wordTimings[i].startTime && currentTime <= wordTimings[i].endTime) {
      currentWordIndex = i;
      break;
    }
  }

  const maxTextWidth = width - safePadding * 4;
  let fontSize = Math.round(height * 0.04);
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';

  const getTextMetrics = () => {
    const wordWidths = words.map(w => ctx.measureText(w).width);
    const spaceWidth = ctx.measureText(' ').width;
    const totalWidth = wordWidths.reduce((sum, w) => sum + w, 0) + spaceWidth * (words.length - 1);
    return { wordWidths, spaceWidth, totalWidth };
  };

  let metrics = getTextMetrics();
  
  while (metrics.totalWidth > maxTextWidth && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    metrics = getTextMetrics();
  }

  const { wordWidths, spaceWidth, totalWidth } = metrics;

  let x = Math.max(safePadding * 2, (width - totalWidth) / 2);
  const y = barY + barHeight / 2;

  words.forEach((word, i) => {
    const wordWidth = wordWidths[i];
    const isHighlighted = i === currentWordIndex;

    if (isHighlighted) {
      const padding = fontSize * 0.3;
      const pillHeight = fontSize * 1.4;
      
      ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.beginPath();
      ctx.roundRect(
        x - padding,
        y - pillHeight / 2,
        wordWidth + padding * 2,
        pillHeight,
        8
      );
      ctx.fill();
      
      ctx.fillStyle = '#1f2937';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    }

    ctx.fillText(word, x, y);
    x += wordWidth + spaceWidth;
  });
}

/**
 * Generate a complete book video using a single recording session
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

  const contentPages = pages.filter(isContentPage);
  const totalPages = contentPages.length;

  if (totalPages === 0) {
    throw new Error('No content pages found in book');
  }

  onProgress?.({
    phase: 'preparing',
    currentPage: 0,
    totalPages,
    pageProgress: 0,
    overallProgress: 2,
  });

  // Validate all pages have images
  const pageImageUrls: string[] = [];
  for (const page of contentPages) {
    const imageUrl = getImageUrl(page);
    if (!imageUrl) {
      throw new Error(`Page ${page.letter} (${page.title}) is missing an image`);
    }
    pageImageUrls.push(imageUrl);
  }

  await yieldToBrowser();

  // Prefetch all page data upfront
  onProgress?.({
    phase: 'prefetching',
    currentPage: 0,
    totalPages,
    pageProgress: 0,
    overallProgress: 5,
  });

  const audioContext = new AudioContext();
  const pagesData: PageData[] = [];

  try {
    // Load all resources in parallel batches
    const BATCH_SIZE = 3;
    for (let batchStart = 0; batchStart < contentPages.length; batchStart += BATCH_SIZE) {
      if (abortSignal?.aborted) {
        throw new Error('Video generation cancelled');
      }

      const batchEnd = Math.min(batchStart + BATCH_SIZE, contentPages.length);
      const batchPromises: Promise<PageData>[] = [];

      for (let i = batchStart; i < batchEnd; i++) {
        const page = contentPages[i];
        const imageUrl = pageImageUrls[i];
        const text = getPageNarrationText(page);

        batchPromises.push(
          (async (): Promise<PageData> => {
            const [image, ttsData] = await Promise.all([
              loadImage(imageUrl),
              ttsRequestQueue.enqueue(() => fetchTTSWithTimings(text, voiceId)),
            ]);
            const audioBuffer = await base64ToAudioBuffer(ttsData.audio_base64, audioContext);
            return { page, imageUrl, image, text, ttsData, audioBuffer };
          })()
        );
      }

      const batchResults = await Promise.all(batchPromises);
      pagesData.push(...batchResults);

      const prefetchProgress = 5 + ((batchEnd / contentPages.length) * 15);
      onProgress?.({
        phase: 'prefetching',
        currentPage: batchEnd,
        totalPages,
        pageProgress: Math.round((batchEnd / contentPages.length) * 100),
        overallProgress: Math.round(prefetchProgress),
      });

      await yieldToBrowser();
    }

    // Set up canvas
    const { width, height } = DIMENSIONS[aspectRatio];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Set up recording
    const audioDestination = audioContext.createMediaStreamDestination();
    const canvasStream = canvas.captureStream(60);
    audioDestination.stream.getAudioTracks().forEach(track => {
      canvasStream.addTrack(track);
    });

    const { mimeType, format } = getBestMimeType();
    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 5000000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Calculate total duration
    const INTRO_HOLD = 1.0;
    const OUTRO_HOLD = 1.0;
    const PAGE_GAP = 0.5;

    let totalDuration = 0;
    const pageStartTimes: number[] = [];
    
    for (let i = 0; i < pagesData.length; i++) {
      pageStartTimes.push(totalDuration);
      const pageDuration = INTRO_HOLD + pagesData[i].audioBuffer.duration + OUTRO_HOLD;
      totalDuration += pageDuration + (i < pagesData.length - 1 ? PAGE_GAP : 0);
    }

    onProgress?.({
      phase: 'generating',
      currentPage: 1,
      totalPages,
      pageProgress: 0,
      overallProgress: 20,
    });

    // Start recording and schedule all audio
    return new Promise((resolve, reject) => {
      if (abortSignal?.aborted) {
        reject(new Error('Video generation cancelled'));
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        audioContext.close();
        resolve({ blob, format, mimeType });
      };

      mediaRecorder.onerror = (e) => {
        audioContext.close();
        reject(e);
      };

      mediaRecorder.start();

      // Schedule all audio playback
      const recordingStartTime = audioContext.currentTime;
      const audioSources: AudioBufferSourceNode[] = [];

      for (let i = 0; i < pagesData.length; i++) {
        const pageData = pagesData[i];
        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = pageData.audioBuffer;
        audioSource.connect(audioDestination);
        
        const audioStartTime = recordingStartTime + pageStartTimes[i] + INTRO_HOLD;
        audioSource.start(audioStartTime);
        audioSources.push(audioSource);
      }

      const animationStartTime = performance.now();
      let animationId: number;
      let lastPageIndex = -1;

      const animate = () => {
        if (abortSignal?.aborted) {
          cancelAnimationFrame(animationId);
          audioSources.forEach(s => { try { s.stop(); } catch {} });
          mediaRecorder.stop();
          reject(new Error('Video generation cancelled'));
          return;
        }

        const elapsed = (performance.now() - animationStartTime) / 1000;

        // Find current page
        let currentPageIndex = 0;
        for (let i = pagesData.length - 1; i >= 0; i--) {
          if (elapsed >= pageStartTimes[i]) {
            currentPageIndex = i;
            break;
          }
        }

        const pageData = pagesData[currentPageIndex];
        const pageElapsed = elapsed - pageStartTimes[currentPageIndex];
        const audioTime = pageElapsed - INTRO_HOLD;
        const words = pageData.text.split(/\s+/).filter(Boolean);

        drawFrame(ctx, pageData.image, words, pageData.ttsData.wordTimings, audioTime);

        // Update progress
        if (currentPageIndex !== lastPageIndex) {
          lastPageIndex = currentPageIndex;
        }

        const overallProgress = 20 + ((elapsed / totalDuration) * 75);
        const pageDuration = INTRO_HOLD + pageData.audioBuffer.duration + OUTRO_HOLD;
        const pageProgress = Math.min(100, (pageElapsed / pageDuration) * 100);

        onProgress?.({
          phase: 'generating',
          currentPage: currentPageIndex + 1,
          totalPages,
          currentLetter: pageData.page.letter,
          currentPageTitle: pageData.page.title,
          pageProgress: Math.round(pageProgress),
          overallProgress: Math.round(Math.min(95, overallProgress)),
          estimatedTimeRemaining: Math.max(0, Math.round(totalDuration - elapsed)),
        });

        if (elapsed < totalDuration) {
          animationId = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(animationId);
          mediaRecorder.stop();
          onProgress?.({
            phase: 'complete',
            currentPage: totalPages,
            totalPages,
            pageProgress: 100,
            overallProgress: 100,
          });
        }
      };

      animationId = requestAnimationFrame(animate);
    });
  } catch (error) {
    audioContext.close();
    throw error;
  }
}

export async function downloadBookVideo(
  result: VideoResult, 
  bookName: string, 
  aspectRatio: string,
  bookId?: string
): Promise<VideoUploadResult> {
  const sanitizedName = bookName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const extension = result.format === 'mp4' ? 'mp4' : 'webm';
  const filename = `${sanitizedName}-${aspectRatio}.${extension}`;
  
  const uploadResult = await saveAndOpenVideo(result.blob, filename, bookId);
  
  // If storage failed, fall back to local download
  if (!uploadResult.success) {
    console.warn('Storage upload failed, falling back to local:', uploadResult.error);
    const url = URL.createObjectURL(result.blob);
    const newTab = window.open(url, '_blank');
    
    if (!newTab) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
  
  return uploadResult;
}

export { type VideoUploadResult };
