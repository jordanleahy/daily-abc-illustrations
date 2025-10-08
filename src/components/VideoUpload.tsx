import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, Video } from "lucide-react";
import { toast } from "sonner";
import { processVideo, validateVideo, formatFileSize } from "@/utils/videoProcessor";

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function VideoUpload({ onVideoSelect, disabled = false, className = "" }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validationError = validateVideo(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Process and compress the video
    setIsProcessing(true);
    try {
      toast.info('Compressing video... This may take a minute', { duration: 5000 });
      
      const processed = await processVideo(file, {
        maxWidth: 720,
        maxHeight: 1280, // Portrait
        targetSizeKB: 5000, // 5MB target
        videoBitrate: 1000000, // 1 Mbps for good quality but small size
        audioBitrate: 128000,
      });

      // Show compression results
      const savedPercentage = Math.round((1 - processed.compressionRatio) * 100);
      toast.success(
        `Video optimized: ${formatFileSize(processed.originalSize)} → ${formatFileSize(processed.compressedSize)} (${savedPercentage}% smaller)`,
        { duration: 5000 }
      );

      // Set preview from processed video
      setPreview(processed.dataUrl);

      // Create a File object from the compressed blob
      const compressedFile = new File(
        [processed.blob],
        file.name.replace(/\.[^.]+$/, '.webm'), // Change extension to webm
        { type: processed.blob.type }
      );

      onVideoSelect(compressedFile);
    } catch (error) {
      console.error('Video processing error:', error);
      toast.error('Failed to process video. Please try a different video or reduce the file size.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const openFileSelector = () => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        className={`
          w-full h-full border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          ${preview ? 'p-0' : 'p-6'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Compressing video...</p>
            <p className="text-xs text-muted-foreground">
              This may take a minute. Please wait...
            </p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full">
            <video
              src={preview}
              className="w-full h-full object-cover rounded-lg"
              controls
              playsInline
              muted
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <Button variant="secondary" size="sm">
                  Change Video
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Video className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Upload Portrait Video</p>
              <p className="text-xs text-muted-foreground">
                Drop video here or click to browse
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>MP4, WebM, MOV • Max 50MB • Portrait recommended</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
