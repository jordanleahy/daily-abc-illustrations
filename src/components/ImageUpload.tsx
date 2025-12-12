import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Sparkles } from "lucide-react";
import { processImage } from "@/utils/imageProcessor";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
  autoTrigger?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
  existingImageUrl?: string;
}

export function ImageUpload({ 
  onImageSelect, 
  disabled = false, 
  className = "", 
  autoTrigger = false, 
  onGenerate, 
  isGenerating = false, 
  existingImageUrl 
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (existingImageUrl) {
      setPreview(existingImageUrl);
    }
  }, [existingImageUrl]);

  useEffect(() => {
    if (autoTrigger && !disabled && fileInputRef.current) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, disabled]);

  const handleFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({ title: "Invalid file", description: "Please select an image or video", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      if (isVideo) {
        onImageSelect(file);
      } else {
        const processed = await processImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.88 });
        setPreview(processed.dataUrl);
        const compressedFile = new File([processed.blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: processed.blob.type });
        onImageSelect(compressedFile);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast({ title: "Processing failed", description: "Please try another file", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (disabled || isProcessing) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          await handleFile(file);
          return;
        }
      }
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
    <div 
      ref={containerRef}
      className={`
        w-full h-full rounded-lg transition-all duration-200 cursor-pointer
        bg-muted/50
        ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/80'}
        ${preview ? 'p-0' : 'p-6'}
        ${className}
      `}
      onClick={() => containerRef.current?.focus()}
      onPaste={handlePaste}
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center text-center space-y-3 h-full">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Optimizing...</p>
        </div>
      ) : preview ? (
        <div className="relative w-full h-full min-h-[200px]">
          <img src={preview} alt="Uploaded" className="w-full h-full object-cover rounded-lg" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button type="button" variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openFileSelector(); }}>
              Change
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center space-y-4 h-full">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Tap to paste or browse</p>
            <Button type="button" onClick={(e) => { e.stopPropagation(); openFileSelector(); }} variant="outline" size="sm" disabled={disabled || isProcessing}>
              Browse Files
            </Button>
          </div>
          {onGenerate && (
            <div className="w-full max-w-xs pt-4 border-t">
              <Button type="button" onClick={(e) => { e.stopPropagation(); onGenerate(); }} variant="outline" size="lg" className="w-full" disabled={isProcessing || isGenerating}>
                <Sparkles className="h-5 w-5 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
