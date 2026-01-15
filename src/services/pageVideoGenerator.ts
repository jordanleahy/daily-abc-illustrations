/**
 * Page Video Generator Service
 * 
 * Generates WebM videos with:
 * - Static background illustration
 * - Word-by-word highlighted text overlay
 * - Synced ElevenLabs TTS audio
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

const DIMENSIONS = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George

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

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background image (cover)
  const imgRatio = image.width / image.height;
  const canvasRatio = width / height;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (imgRatio > canvasRatio) {
    // Image is wider - fit by height
    drawHeight = height;
    drawWidth = height * imgRatio;
    drawX = (width - drawWidth) / 2;
    drawY = 0;
  } else {
    // Image is taller - fit by width
    drawWidth = width;
    drawHeight = width / imgRatio;
    drawX = 0;
    drawY = (height - drawHeight) / 2;
  }
  
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  // Draw text bar at bottom
  const barHeight = Math.round(height * 0.1);
  const barY = height - barHeight;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, barY, width, barHeight);

  // Find current word index
  let currentWordIndex = -1;
  for (let i = 0; i < wordTimings.length; i++) {
    if (currentTime >= wordTimings[i].startTime && currentTime <= wordTimings[i].endTime) {
      currentWordIndex = i;
      break;
    }
  }

  // Configure text
  const fontSize = Math.round(height * 0.04);
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';

  // Calculate total text width for centering
  const wordWidths = words.map(w => ctx.measureText(w).width);
  const spaceWidth = ctx.measureText(' ').width;
  const totalWidth = wordWidths.reduce((sum, w) => sum + w, 0) + spaceWidth * (words.length - 1);

  // Starting X position (centered)
  let x = (width - totalWidth) / 2;
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
 */
export async function generatePageVideo(config: PageVideoConfig): Promise<Blob> {
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

  // Set up MediaRecorder
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

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

  // Start recording
  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      audioContext.close();
      resolve(blob);
    };

    mediaRecorder.onerror = (e) => {
      audioContext.close();
      reject(e);
    };

    mediaRecorder.start();
    audioSource.start();

    const startTime = performance.now();
    let animationId: number;

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      
      // Update progress (40-95%)
      const progressPercent = Math.min(40 + (elapsed / audioDuration) * 55, 95);
      onProgress?.(Math.round(progressPercent));

      // Draw current frame
      drawFrame(ctx, image, words, ttsData.wordTimings, elapsed);

      if (elapsed < audioDuration + 0.5) {
        // Add 0.5s buffer after audio ends
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
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
