import { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Upload, Wand2, Loader2, ClipboardPaste, X, Check } from 'lucide-react';
import { processImage } from '@/utils/imageProcessor';
import { useToast } from '@/hooks/use-toast';

interface ColorModeUploadSectionProps {
  onImageUpload: (base64: string, imageMode: 'color' | 'bw' | 'text') => void;
  onCopyPrompt: () => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  hasPrompt?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
}

export function ColorModeUploadSection({
  onImageUpload,
  onCopyPrompt,
  onGenerate,
  isGenerating = false,
  hasPrompt = false,
  disabled = false,
  onCancel,
}: ColorModeUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Preview state for immediate image display
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const processed = await processImage(file, { maxWidth: 1024, maxHeight: 1024 });
      // Show preview immediately
      setPreviewImage(processed.dataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not process the image',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast]);

  const handlePasteEvent = useCallback(async (e: ClipboardEvent) => {
    if (disabled || isProcessing) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          setIsProcessing(true);
          try {
            const processed = await processImage(blob, { maxWidth: 1024, maxHeight: 1024 });
            // Show preview immediately instead of uploading
            setPreviewImage(processed.dataUrl);
          } catch (error) {
            console.error('Error processing pasted image:', error);
            toast({
              title: 'Paste failed',
              description: 'Could not process the pasted image',
              variant: 'destructive',
            });
          } finally {
            setIsProcessing(false);
          }
        }
        return;
      }
    }
  }, [disabled, isProcessing, toast]);

  // Add global paste listener when component is mounted
  useEffect(() => {
    document.addEventListener('paste', handlePasteEvent);
    return () => {
      document.removeEventListener('paste', handlePasteEvent);
    };
  }, [handlePasteEvent]);

  const handlePasteButtonClick = useCallback(async () => {
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'pasted-image.png', { type: imageType });
          const processed = await processImage(file, { maxWidth: 1024, maxHeight: 1024 });
          // Show preview immediately
          setPreviewImage(processed.dataUrl);
          return;
        }
      }
      toast({
        title: 'No image found',
        description: 'Copy an image to your clipboard first',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error reading clipboard:', error);
      toast({
        title: 'Paste failed',
        description: 'Could not read from clipboard. Try using Ctrl/Cmd+V instead.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, toast]);

  // Confirm the preview and upload
  const handleConfirmUpload = useCallback(() => {
    if (previewImage) {
      onImageUpload(previewImage, 'color');
      setPreviewImage(null);
      onCancel?.();
    }
  }, [previewImage, onImageUpload, onCancel]);

  // Clear preview and go back to upload options
  const handleClearPreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  // If we have a preview image, show it with confirm/cancel buttons
  if (previewImage) {
    return (
      <div className="relative w-full h-full flex flex-col">
        {/* Preview image */}
        <div className="flex-1 relative overflow-hidden rounded-lg m-2">
          <img 
            src={previewImage} 
            alt="Preview" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 p-4 pt-2">
          <Button
            onClick={handleClearPreview}
            variant="outline"
            className="flex-1 h-12 gap-2"
          >
            <X className="h-5 w-5" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpload}
            variant="default"
            className="flex-1 h-12 gap-2"
          >
            <Check className="h-5 w-5" />
            Use Image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col p-4 text-center">
      {onCancel && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          className="absolute top-2 right-2 text-xs h-7"
        >
          Cancel
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isGenerating || isProcessing}
      />
      
      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Processing...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            className="w-full h-12 gap-2"
            disabled={disabled || isGenerating}
          >
            <Upload className="h-5 w-5" />
            Upload
          </Button>
          
          <Button
            onClick={handlePasteButtonClick}
            variant="secondary"
            className="w-full h-12 gap-2"
            disabled={disabled || isGenerating}
          >
            <ClipboardPaste className="h-5 w-5" />
            Paste
          </Button>
          
          <Button
            onClick={onGenerate}
            variant="default"
            className="w-full h-12 gap-2"
            disabled={disabled || isGenerating || !onGenerate}
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="h-5 w-5" />
            )}
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCopyPrompt();
            }}
            variant="outline"
            className="w-full h-12 gap-2"
            disabled={disabled || isGenerating || !hasPrompt}
          >
            <Copy className="h-5 w-5" />
            Copy Prompt
          </Button>
        </div>
      )}
    </div>
  );
}
