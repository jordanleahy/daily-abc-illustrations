import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Upload, ClipboardPaste } from 'lucide-react';
import { processImage } from '@/utils/imageProcessor';
import { useToast } from '@/hooks/use-toast';

interface ColorModeUploadSectionProps {
  onImageUpload: (base64: string, imageMode: 'color' | 'bw' | 'text') => void;
  onCopyPrompt: () => void;
  disabled?: boolean;
}

export function ColorModeUploadSection({
  onImageUpload,
  onCopyPrompt,
  disabled = false,
}: ColorModeUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processImage(file, { maxWidth: 1024, maxHeight: 1024 });
      onImageUpload(processed.dataUrl, 'color');
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
  }, [onImageUpload, toast]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'pasted-image.png', { type: imageType });
          const processed = await processImage(file, { maxWidth: 1024, maxHeight: 1024 });
          onImageUpload(processed.dataUrl, 'color');
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
  }, [onImageUpload, toast]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="default"
          size="sm"
          className="w-full gap-2"
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        
        <Button
          onClick={handlePaste}
          variant="secondary"
          size="sm"
          className="w-full gap-2"
          disabled={disabled}
        >
          <ClipboardPaste className="h-4 w-4" />
          Paste
        </Button>
        
        <Button
          onClick={onCopyPrompt}
          variant="outline"
          size="sm"
          className="w-full gap-2"
          disabled={disabled}
        >
          <Copy className="h-4 w-4" />
          Copy Prompt
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        Upload or paste your color image
      </p>
    </div>
  );
}
