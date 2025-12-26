import { useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Upload, Sparkles, Loader2 } from 'lucide-react';
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

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processImage(file, { maxWidth: 1024, maxHeight: 1024 });
      onImageUpload(processed.dataUrl, 'color');
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

  const handlePasteEvent = useCallback(async (e: ClipboardEvent) => {
    if (disabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          try {
            const processed = await processImage(blob, { maxWidth: 1024, maxHeight: 1024 });
            onImageUpload(processed.dataUrl, 'color');
            onCancel?.();
          } catch (error) {
            console.error('Error processing pasted image:', error);
            toast({
              title: 'Paste failed',
              description: 'Could not process the pasted image',
              variant: 'destructive',
            });
          }
        }
        return;
      }
    }
  }, [disabled, onImageUpload, onCancel, toast]);

  // Add global paste listener when component is mounted
  useEffect(() => {
    document.addEventListener('paste', handlePasteEvent);
    return () => {
      document.removeEventListener('paste', handlePasteEvent);
    };
  }, [handlePasteEvent]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center gap-3"
    >
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
        disabled={disabled}
      />
      
      <div className="flex flex-col gap-3 w-full">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="default"
          className="w-full h-12 gap-2 text-base"
          disabled={disabled}
        >
          <Upload className="h-5 w-5" />
          Upload
        </Button>
        
        {onGenerate && (
          <Button
            onClick={onGenerate}
            variant="secondary"
            className="w-full h-12 gap-2 text-base"
            disabled={disabled || isGenerating || !hasPrompt}
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        )}
        
        <Button
          onClick={onCopyPrompt}
          variant="outline"
          className="w-full h-12 gap-2 text-base"
          disabled={disabled}
        >
          <Copy className="h-5 w-5" />
          Copy Prompt
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        Upload, generate with AI, or paste (Ctrl/Cmd+V)
      </p>
    </div>
  );
}
