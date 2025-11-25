import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2, Play } from 'lucide-react';
import { processVideo, validateVideo, validateVideoDuration } from '@/utils/videoProcessor';
import { uploadTrickVideo, uploadTrickVideoThumbnail, deleteTrickVideo } from '@/utils/trickVideoUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VideoData } from '@/types/trick';

const MAX_VIDEOS = 3;

interface TrickVideoUploadProps {
  videos: VideoData[];
  onVideosChange: (videos: VideoData[]) => void;
  disabled?: boolean;
}

export function TrickVideoUpload({ videos, onVideosChange, disabled }: TrickVideoUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const generateThumbnail = (video: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      video.currentTime = 0.1;
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        }, 'image/jpeg', 0.8);
      };
    });
  };

  const handleAddVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check limit
    if (videos.length + files.length > MAX_VIDEOS) {
      toast.error(`Maximum ${MAX_VIDEOS} videos allowed`);
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    const uploadedVideos: VideoData[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Processing ${i + 1}/${files.length}...`);
        
        // Validate file type
        const typeError = validateVideo(file);
        if (typeError) {
          toast.error(typeError);
          continue;
        }

        // Validate duration (30 seconds max)
        const durationError = await validateVideoDuration(file);
        if (durationError) {
          toast.error(durationError);
          continue;
        }

        // Process video with compression
        const processed = await processVideo(file, {
          maxWidth: 720,
          maxHeight: 1280,
          videoBitrate: 1000000, // 1 Mbps
          audioBitrate: 128000, // 128 kbps
        });

        setUploadProgress(`Generating thumbnail ${i + 1}/${files.length}...`);
        
        // Generate thumbnail
        const video = document.createElement('video');
        const videoObjectUrl = URL.createObjectURL(processed.blob);
        video.src = videoObjectUrl;
        
        await new Promise(resolve => {
          video.onloadedmetadata = resolve;
        });
        
        const thumbnailBlob = await generateThumbnail(video);
        
        // Cleanup video element and object URL
        URL.revokeObjectURL(videoObjectUrl);
        video.src = '';
        video.load();

        setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
        
        // Upload video and thumbnail to Supabase Storage
        const videoUrl = await uploadTrickVideo(processed.blob, user.id);
        const thumbnailUrl = await uploadTrickVideoThumbnail(thumbnailBlob, user.id);

        uploadedVideos.push({
          dataUrl: videoUrl,
          thumbnail: thumbnailUrl,
          duration: processed.duration,
        });
      }

      if (uploadedVideos.length > 0) {
        onVideosChange([...videos, ...uploadedVideos]);
        toast.success(`${uploadedVideos.length} video(s) uploaded`);
      }
    } catch (error) {
      console.error('Failed to upload videos:', error);
      toast.error('Failed to upload videos');
    } finally {
      setIsProcessing(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const handleRemoveVideo = async (index: number) => {
    const video = videos[index];
    
    // Delete from storage if it's a storage URL
    if (video.dataUrl.includes('trick-photos')) {
      try {
        await deleteTrickVideo(video.dataUrl);
        await deleteTrickVideo(video.thumbnail);
      } catch (error) {
        console.error('Failed to delete video from storage:', error);
      }
    }
    
    onVideosChange(videos.filter((_, i) => i !== index));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <Label>Videos (Optional - Max {MAX_VIDEOS}, 30 seconds each)</Label>
      <div className="flex flex-wrap gap-2">
        {videos.map((video, index) => (
          <div key={index} className="relative group">
            <div className="w-16 h-16 rounded-lg border-2 border-border overflow-hidden relative">
              <img
                src={video.thumbnail}
                alt={`Video ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 rounded-tl">
                {formatDuration(video.duration)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveVideo(index)}
              disabled={disabled || isProcessing}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <label className="relative">
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleAddVideos}
            disabled={disabled || isProcessing}
            className="sr-only"
          />
          <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent transition-colors">
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        </label>
      </div>
      {isProcessing && (
        <p className="text-xs text-muted-foreground">
          {uploadProgress || 'Processing...'}
        </p>
      )}
    </div>
  );
}
