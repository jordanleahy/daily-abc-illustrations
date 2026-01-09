import { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, ClipboardPaste, Wand2, Loader2 } from 'lucide-react';
import { processImage } from '@/utils/imageProcessor';
import { useToast } from '@/hooks/use-toast';

interface BWModeUploadSectionProps {
  onImageUpload: (base64: string, imageMode: 'color' | 'bw' | 'text') => void;
  onGenerate: () => void;
  hasTextImage: boolean;
  hasColorImage?: boolean;
  isSpecialPage?: boolean;
  isGenerating: boolean;
  disabled?: boolean;
  onCancel?: () => void;
}

export function BWModeUploadSection({
  onImageUpload,
  onGenerate,
  hasTextImage,
  hasColorImage = false,
  isSpecialPage = false,
  isGenerating,
  disabled = false,
  onCancel,
}: BWModeUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processImage(file, { maxWidth: 1024, maxHeight: 1024 });
      onImageUpload(processed.dataUrl, 'bw');
      onCancel?.();
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not process the image',
        variant: 'destructive',
      });
    }
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageUpload, onCancel, toast]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'pasted-image.png', { type: imageType });
          const processed = await processImage(file, { maxWidth: 1024, maxHeight: 1024 });
          onImageUpload(processed.dataUrl, 'bw');
          onCancel?.();
          return;
        }
      }
      toast({
        title: 'No image found',
        description: 'Copy an image to your clipboard first',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Paste error:', error);
      toast({
        title: 'Paste failed',
        description: 'Could not read from clipboard. Try using the upload button.',
        variant: 'destructive',
      });
    }
  }, [onImageUpload, onCancel, toast]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center gap-3">
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
        disabled={disabled || isGenerating}
      />
      
      <div className="flex flex-col gap-3 w-full">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          className="w-full h-12 gap-2"
          disabled={disabled || isGenerating}
        >
          <Upload className="h-5 w-5" />
          Upload B&W Image
        </Button>
        
        <Button
          onClick={handlePaste}
          variant="secondary"
          className="w-full h-12 gap-2"
          disabled={disabled || isGenerating}
        >
          <ClipboardPaste className="h-5 w-5" />
          Paste
        </Button>
        
        {/* Show generate button if has text image OR (is special page AND has color image) */}
        {(hasTextImage || (isSpecialPage && hasColorImage)) && (
          <>
            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            
            <Button
              onClick={onGenerate}
              variant="default"
              className="w-full h-12 gap-2"
              disabled={disabled || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
              {isGenerating 
                ? 'Generating...' 
                : hasTextImage 
                  ? 'Generate from Text Image' 
                  : 'Generate from Color Image'}
            </Button>
          </>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        {hasTextImage 
          ? 'Upload your own or generate from text image'
          : isSpecialPage && hasColorImage
            ? 'Upload your own or generate from color image'
            : 'Generate a text image first, then create B&W version'
        }
      </p>
    </div>
  );
}
