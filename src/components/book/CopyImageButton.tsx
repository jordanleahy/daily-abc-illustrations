import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CopyImageButtonProps {
  imageUrl: string;
  bookName?: string;
}

export function CopyImageButton({ imageUrl, bookName = 'Image' }: CopyImageButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyImageToClipboard = async () => {
    setIsLoading(true);
    try {
      // Use canvas approach for iOS Safari compatibility
      // iOS requires PNG format for clipboard
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, 0, 0);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          'image/png'
        );
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);

      setCopied(true);
      toast({
        title: "Image copied!",
        description: `${bookName} copied to clipboard`,
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast({
        title: "Copy failed",
        description: "Could not copy image to clipboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="icon"
      variant="secondary"
      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      onClick={(e) => {
        e.stopPropagation();
        copyImageToClipboard();
      }}
      disabled={isLoading}
      aria-label="Copy image"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
