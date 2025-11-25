import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2 } from 'lucide-react';
import { processImage } from '@/utils/imageProcessor';
import { toast } from 'sonner';

interface TrickImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
}

export function TrickImageUpload({ images, onImagesChange, disabled }: TrickImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    const processedImages: string[] = [];

    try {
      for (const file of files) {
        const processed = await processImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          targetSizeBytes: 150 * 1024, // 150KB
          quality: 0.85,
        });
        processedImages.push(processed.dataUrl);
      }
      onImagesChange([...images, ...processedImages]);
      toast.success(`${files.length} image(s) added`);
    } catch (error) {
      console.error('Failed to process images:', error);
      toast.error('Failed to process images');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Images (Optional)</Label>
      <div className="flex flex-wrap gap-2">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <img
              src={imageUrl}
              alt={`Trick ${index + 1}`}
              className="w-16 h-16 object-cover rounded-lg border-2 border-border"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
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
            accept="image/*"
            multiple
            onChange={handleAddImages}
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
        <p className="text-xs text-muted-foreground">Compressing images...</p>
      )}
    </div>
  );
}
