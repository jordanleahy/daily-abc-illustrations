/**
 * Page Video Generator Service
 * 
 * Generates videos with:
 * - Static background illustration
 * - Word-by-word highlighted text overlay
 * - Synced ElevenLabs TTS audio
 * 
 * Supports MP4 on iOS/Safari for compatibility
 */

import { supabase } from '@/integrations/supabase/client';

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface PageVideoConfig {
  imageUrl: string;
  text: string;
  voiceId?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  onProgress?: (progress: number) => void;
}

interface TTSResponse {
  audio_base64: string;
  wordTimings: WordTiming[];
  originalText: string;
}

export interface VideoResult {
  blob: Blob;
  format: 'mp4' | 'webm';
  mimeType: string;
}

const DIMENSIONS = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George

/**
 * Detect iOS or Safari browser for MP4 compatibility
 */
function isIOSOrSafari(): boolean {
  const ua = navigator.userAgent;
  
  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Safari detection (not Chrome on Mac)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  
  return isIOS || isSafari;
}

/**
 * Get the best supported video mime type for the current browser
 */
function getBestMimeType(): { mimeType: string; format: 'mp4' | 'webm' } {
  // On iOS/Safari, try MP4 first
  if (isIOSOrSafari()) {
    // Try various MP4 codec strings Safari might support
    const mp4Types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1.4d002a',
      'video/mp4',
    ];
    
    for (const type of mp4Types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using MP4 format for iOS/Safari:', type);
        return { mimeType: type, format: 'mp4' };
      }
    }
    
    // Fallback to WebM even on Safari if MP4 not supported
    console.warn('MP4 not supported on this Safari/iOS device, trying WebM');
  }
  
  // Default to WebM (best browser support for recording)
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    return { mimeType: 'video/webm;codecs=vp9,opus', format: 'webm' };
  }
  
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    return { mimeType: 'video/webm;codecs=vp8,opus', format: 'webm' };
  }
  
  return { mimeType: 'video/webm', format: 'webm' };
}

/**
 * Fetch TTS audio with word timings from ElevenLabs edge function
 */
async function fetchTTSWithTimings(text: string, voiceId: string): Promise<TTSResponse> {
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
 * Load an image from URL into an HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Convert base64 audio to AudioBuffer
 */
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

/**
 * Draw a single frame of the video
 */
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
    // Image is taller/square - fit by height (this is the square image case)
    drawHeight = height;
    drawWidth = height * imgRatio;
    drawX = (width - drawWidth) / 2;
    drawY = 0;
  }
  
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  // Safe padding from edges (16px minimum, scaled for resolution)
  const safePadding = Math.max(16, Math.round(width * 0.03));
  
  // Draw text bar at bottom with padding from bottom edge
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

  // Configure text - scale font size to fit within safe area
  const maxTextWidth = width - safePadding * 4; // Leave padding on both sides
  let fontSize = Math.round(height * 0.04);
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';

  // Calculate total text width
  const getTextMetrics = () => {
    const wordWidths = words.map(w => ctx.measureText(w).width);
    const spaceWidth = ctx.measureText(' ').width;
    const totalWidth = wordWidths.reduce((sum, w) => sum + w, 0) + spaceWidth * (words.length - 1);
    return { wordWidths, spaceWidth, totalWidth };
  };

  let metrics = getTextMetrics();
  
  // Reduce font size if text is too wide for safe area
  while (metrics.totalWidth > maxTextWidth && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    metrics = getTextMetrics();
  }

  const { wordWidths, spaceWidth, totalWidth } = metrics;

  // Starting X position (centered within safe area)
  let x = Math.max(safePadding * 2, (width - totalWidth) / 2);
  const y = barY + barHeight / 2;

  // Draw each word
  words.forEach((word, i) => {
    const wordWidth = wordWidths[i];
    const isHighlighted = i === currentWordIndex;

    if (isHighlighted) {
      // Draw yellow highlight background
      const padding = fontSize * 0.3;
      const pillHeight = fontSize * 1.4;
      
      ctx.fillStyle = 'rgba(250, 204, 21, 0.9)'; // yellow-400
      ctx.beginPath();
      ctx.roundRect(
        x - padding,
        y - pillHeight / 2,
        wordWidth + padding * 2,
        pillHeight,
        8
      );
      ctx.fill();
      
      ctx.fillStyle = '#1f2937'; // gray-800 text
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    }

    ctx.fillText(word, x, y);
    x += wordWidth + spaceWidth;
  });
}

/**
 * Generate a video from page content
 * Returns VideoResult with blob, format, and mimeType
 */
export async function generatePageVideo(config: PageVideoConfig): Promise<VideoResult> {
  const {
    imageUrl,
    text,
    voiceId = DEFAULT_VOICE_ID,
    aspectRatio = 'portrait',
    onProgress,
  } = config;

  onProgress?.(5);

  // Fetch TTS with timings
  const ttsData = await fetchTTSWithTimings(text, voiceId);
  onProgress?.(20);

  // Load background image
  const image = await loadImage(imageUrl);
  onProgress?.(30);

  // Set up canvas
  const { width, height } = DIMENSIONS[aspectRatio];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Set up audio
  const audioContext = new AudioContext();
  const audioBuffer = await base64ToAudioBuffer(ttsData.audio_base64, audioContext);
  const audioDuration = audioBuffer.duration;
  onProgress?.(40);

  // Create audio destination for recording
  const audioDestination = audioContext.createMediaStreamDestination();
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.connect(audioDestination);

  // Capture canvas stream
  const canvasStream = canvas.captureStream(60);
  
  // Add audio track to canvas stream
  audioDestination.stream.getAudioTracks().forEach(track => {
    canvasStream.addTrack(track);
  });

  // Get best mime type for this browser
  const { mimeType, format } = getBestMimeType();
  console.log(`Recording video with format: ${format}, mimeType: ${mimeType}`);

  const mediaRecorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 5000000, // 5 Mbps
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Parse words from text
  const words = text.split(/\s+/).filter(Boolean);

  // Timing configuration
  const introHoldDuration = 2.0; // 2 seconds before audio starts
  const outroHoldDuration = 2.0; // 2 seconds after audio ends
  const totalDuration = introHoldDuration + audioDuration + outroHoldDuration;

  // Start recording
  return new Promise((resolve, reject) => {
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
    
    // Schedule audio to start after intro hold
    audioSource.start(audioContext.currentTime + introHoldDuration);

    const startTime = performance.now();
    let animationId: number;

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      
      // Update progress (40-95%)
      const progressPercent = Math.min(40 + (elapsed / totalDuration) * 55, 95);
      onProgress?.(Math.round(progressPercent));

      // Calculate audio time (offset by intro hold duration)
      // During intro: audioTime will be negative (no word highlighted)
      // During audio: audioTime syncs with word timings
      // During outro: audioTime will be past the last word timing
      const audioTime = elapsed - introHoldDuration;

      // Draw current frame with adjusted time for word highlighting
      drawFrame(ctx, image, words, ttsData.wordTimings, audioTime);

      if (elapsed < totalDuration) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Stop recording
        cancelAnimationFrame(animationId);
        mediaRecorder.stop();
        onProgress?.(100);
      }
    };

    animationId = requestAnimationFrame(animate);
  });
}

/**
 * Open a blob in a new tab for playback (user can save from there)
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  // Open in new tab - user can play and save from browser
  const newTab = window.open(url, '_blank');
  
  // If popup was blocked, fall back to download
  if (!newTab) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  // Note: Don't revoke URL immediately for new tab - browser needs it for playback
}
