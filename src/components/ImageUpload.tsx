import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, Clipboard, Copy, Sparkles } from "lucide-react";
// Toast notifications removed
import { processImage, formatFileSize } from "@/utils/imageProcessor";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
  autoTrigger?: boolean;
  requireSquare?: boolean;
  showCopyPrompt?: boolean;
  onCopyPrompt?: () => void;
  existingImageUrl?: string;
}

export function ImageUpload({ onImageSelect, disabled = false, className = "", autoTrigger = false, requireSquare = true, showCopyPrompt = false, onCopyPrompt, existingImageUrl }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Update preview when existingImageUrl changes
  useEffect(() => {
    if (existingImageUrl) {
      setPreview(existingImageUrl);
    }
  }, [existingImageUrl]);

  // Auto-trigger file picker when autoTrigger is true
  useEffect(() => {
    if (autoTrigger && !disabled && fileInputRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, disabled]);

  const validateImage = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return 'Please select an image or video file';
    }

    if (isImage) {
      const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        return 'Supported formats: PNG, JPG, WEBP';
      }
      const maxSize = 5 * 1024 * 1024; // 5MB for images
      if (file.size > maxSize) {
        return 'Image must be smaller than 5MB';
      }
    }

    if (isVideo) {
      const maxSize = 50 * 1024 * 1024; // 50MB for videos
      if (file.size > maxSize) {
        return 'Video must be smaller than 50MB';
      }
    }

    return null;
  };

  const checkAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isSquare = Math.abs(aspectRatio - 1) < 0.1; // Allow 10% tolerance
        resolve(isSquare);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFile = async (file: File, isPasted: boolean = false) => {
    const validationError = validateImage(file);
    if (validationError) {
      console.error('File validation error:', validationError);
      return;
    }

    const isVideo = file.type.startsWith('video/');

    // Skip aspect ratio check for videos
    if (!isVideo && requireSquare) {
      const isSquare = await checkAspectRatio(file);
      if (!isSquare) {
        console.error('Image must have a 1:1 aspect ratio (square)');
        return;
      }
    }

    setIsProcessing(true);
    try {
      if (isVideo) {
        // For videos, just pass the file directly without processing
        onImageSelect(file);
      } else {
        // Process and compress images
        const processingOptions = {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.88,
        };

        const processed = await processImage(file, processingOptions);

        // Set preview from processed image
        setPreview(processed.dataUrl);

        // Create a File object from the compressed blob
        const compressedFile = new File(
          [processed.blob],
          file.name.replace(/\.[^.]+$/, '.webp'),
          { type: processed.blob.type }
        );

        onImageSelect(compressedFile);
      }
    } catch (error) {
      console.error('File processing error:', error);
      console.error('Failed to process file. Please try another file.');
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

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (disabled || isProcessing) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    // Find the first image in clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          await handleFile(file, true); // Mark as pasted
          return;
        }
      }
    }

    console.error('No image found in clipboard');
  };

  const handlePasteFromClipboard = async () => {
    if (disabled || isProcessing) return;

    try {
      // Request clipboard permission and read
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `clipboard-image.${type.split('/')[1]}`, { type });
            await handleFile(file, true); // Mark as pasted
            return;
          }
        }
      }
      
      console.error('No image found in clipboard');
    } catch (error) {
      console.error('Clipboard access error:', error);
      
      // Handle different error scenarios
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.error('Clipboard access denied. Please allow clipboard permissions.');
        } else if (error.name === 'NotFoundError') {
          console.error('No image found in clipboard');
        } else {
          console.error('Failed to access clipboard. Try taking a photo instead.');
        }
      }
    }
  };

  const openFileSelector = () => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`
        w-full h-full rounded-lg transition-all duration-200 cursor-pointer
        ${dragActive ? 'bg-primary/10' : 'bg-muted/50'}
        ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/80 hover:ring-1 hover:ring-primary/20'}
        ${preview ? 'p-0' : 'p-6'}
        ${className}
      `}
      onPaste={handlePaste}
      onMouseEnter={() => containerRef.current?.focus()}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Optimizing image...</p>
            <p className="text-xs text-muted-foreground">
              Compressing and resizing for faster uploads
            </p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full min-h-[200px]">
            <img
              src={preview}
              alt="Uploaded image"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex flex-col gap-2 items-center justify-center">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileSelector();
                }}
              >
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4 h-full">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="mx-auto space-y-3">
              <p className="text-sm font-medium">{requireSquare ? 'Upload 1:1 Image' : 'Upload Image or Video'}</p>
              <p className="text-xs text-muted-foreground">
                Drop or paste your file here
              </p>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileSelector();
                }}
                variant="outline"
                size="sm"
                disabled={disabled || isProcessing}
              >
                Browse Files
              </Button>
            </div>
            <div className="w-full max-w-xs mx-auto mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Or use clipboard
              </p>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePasteFromClipboard();
                }}
                variant="outline"
                size="lg"
                className="w-full mx-auto"
                disabled={isProcessing}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate
              </Button>
              
              {showCopyPrompt && onCopyPrompt && (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyPrompt();
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full mx-auto mt-2"
                  disabled={isProcessing}
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copy Prompt
                </Button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}