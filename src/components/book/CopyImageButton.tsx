import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CopyImageButtonProps {
  imageUrl: string;
  bookName: string;
}

export function CopyImageButton({ imageUrl, bookName }: CopyImageButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyImageToClipboard = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      setCopied(true);
      toast({
        title: "Image copied!",
        description: `${bookName} cover copied to clipboard`,
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast({
        title: "Copy failed",
        description: "Please try long-pressing the image instead",
        variant: "destructive"
      });
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
      aria-label="Copy book cover image"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
