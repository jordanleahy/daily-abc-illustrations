/**
 * Video processing utilities for compression and optimization
 */

export interface VideoProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  targetSizeKB?: number;
  videoBitrate?: number;
  audioBitrate?: number;
}

export interface ProcessedVideo {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  duration: number;
}

/**
 * Process and compress a video file
 * Uses canvas and MediaRecorder API for client-side compression
 */
export async function processVideo(
  file: File,
  options: VideoProcessingOptions = {}
): Promise<ProcessedVideo> {
  const {
    maxWidth = 720,
    maxHeight = 1280, // Portrait mode
    targetSizeKB = 5000, // 5MB target
    videoBitrate = 1000000, // 1 Mbps
    audioBitrate = 128000, // 128 kbps
  } = options;

  // Load video
  const video = await loadVideoFromFile(file);
  const originalSize = file.size;

  // Calculate dimensions maintaining aspect ratio
  const { width, height } = calculateVideoDimensions(
    video.videoWidth,
    video.videoHeight,
    maxWidth,
    maxHeight
  );

  // Create canvas for video processing
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Set up MediaRecorder for compression
  const stream = canvas.captureStream(30); // 30 fps
  
  // Add audio track if present
  try {
    const videoElement = video as any;
    if (videoElement.captureStream) {
      const videoStream = videoElement.captureStream();
      const audioTracks = videoStream.getAudioTracks();
      if (audioTracks.length > 0) {
        stream.addTrack(audioTracks[0]);
      }
    }
  } catch (e) {
    // Audio track not available, continue without it
    console.log('No audio track available');
  }

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: videoBitrate,
    audioBitsPerSecond: audioBitrate,
  });

  const chunks: Blob[] = [];
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType });
      const compressedSize = blob.size;
      const dataUrl = await blobToDataUrl(blob);

      resolve({
        blob,
        dataUrl,
        originalSize,
        compressedSize,
        compressionRatio: compressedSize / originalSize,
        width,
        height,
        duration: video.duration,
      });

      // Cleanup
      video.pause();
      video.src = '';
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.onerror = (error) => {
      reject(error);
    };

    // Start recording
    mediaRecorder.start();
    video.currentTime = 0;
    video.play();

    // Draw video frames to canvas
    const drawFrame = () => {
      if (video.paused || video.ended) {
        mediaRecorder.stop();
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      requestAnimationFrame(drawFrame);
    };

    video.onplay = () => {
      drawFrame();
    };

    video.onerror = (error) => {
      mediaRecorder.stop();
      reject(error);
    };
  });
}

/**
 * Load a video file into an HTMLVideoElement
 */
function loadVideoFromFile(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      resolve(video);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate video dimensions maintaining aspect ratio
 */
function calculateVideoDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let newWidth = width;
  let newHeight = height;

  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = (height * maxWidth) / width;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (width * maxHeight) / height;
  }

  // Ensure even dimensions for video encoding
  newWidth = Math.floor(newWidth / 2) * 2;
  newHeight = Math.floor(newHeight / 2) * 2;

  return { width: newWidth, height: newHeight };
}

/**
 * Convert a Blob to a Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Validate video file
 */
export function validateVideo(file: File): string | null {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return 'Please select a video file';
  }

  // Check supported formats
  const supportedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  if (!supportedTypes.includes(file.type)) {
    return 'Supported formats: MP4, WebM, MOV, AVI';
  }

  // Check file size (50MB limit before compression)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return 'Video must be smaller than 50MB';
  }

  return null;
}

/**
 * Validate video duration
 */
export async function validateVideoDuration(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const maxDuration = 30; // 30 seconds max
    
    video.onloadedmetadata = () => {
      const isValid = video.duration <= maxDuration;
      // Cleanup in correct order: revoke URL BEFORE clearing src
      URL.revokeObjectURL(url);
      video.src = '';
      
      if (!isValid) {
        resolve(`Video must be 30 seconds or shorter (current: ${Math.ceil(video.duration)} seconds)`);
      } else {
        resolve(null);
      }
    };
    
    video.onerror = () => {
      // Cleanup in correct order
      URL.revokeObjectURL(url);
      video.src = '';
      resolve('Failed to load video');
    };
    
    video.src = url;
  });
}
