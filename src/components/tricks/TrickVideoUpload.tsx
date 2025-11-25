import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2, Play } from 'lucide-react';
import { processVideo, validateVideo, validateVideoDuration } from '@/utils/videoProcessor';
import { toast } from 'sonner';

interface VideoData {
  dataUrl: string;
  thumbnail: string;
  duration: number;
}

interface TrickVideoUploadProps {
  videos: VideoData[];
  onVideosChange: (videos: VideoData[]) => void;
  disabled?: boolean;
}

export function TrickVideoUpload({ videos, onVideosChange, disabled }: TrickVideoUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateThumbnail = (video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d')!;
      
      video.currentTime = 0.1; // Get frame at 0.1 seconds
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleAddVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    const processedVideos: VideoData[] = [];

    try {
      for (const file of files) {
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

        // Generate thumbnail
        const video = document.createElement('video');
        video.src = processed.dataUrl;
        await new Promise(resolve => video.onloadedmetadata = resolve);
        const thumbnail = await generateThumbnail(video);

        processedVideos.push({
          dataUrl: processed.dataUrl,
          thumbnail,
          duration: processed.duration,
        });
      }

      onVideosChange([...videos, ...processedVideos]);
      toast.success(`${processedVideos.length} video(s) added`);
    } catch (error) {
      console.error('Failed to process videos:', error);
      toast.error('Failed to process videos');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleRemoveVideo = (index: number) => {
    onVideosChange(videos.filter((_, i) => i !== index));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <Label>Videos (Optional - Max 30 seconds)</Label>
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
        <p className="text-xs text-muted-foreground">Compressing videos...</p>
      )}
    </div>
  );
}
