import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2 } from 'lucide-react';
import { processImage } from '@/utils/imageProcessor';
import { uploadTrickPhoto, deleteTrickPhoto } from '@/utils/trickPhotoUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableImageItem } from './SortableImageItem';

const MAX_IMAGES = 5;

interface TrickImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
}

export function TrickImageUpload({ images, onImagesChange, disabled }: TrickImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(img => img === active.id);
      const newIndex = images.findIndex(img => img === over.id);
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check limit
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    const uploadedUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Processing ${i + 1}/${files.length}...`);
        
        // Compress image
        const processed = await processImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          targetSizeBytes: 150 * 1024, // 150KB
          quality: 0.85,
        });
        
        setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
        
        // Upload to Supabase Storage
        // Convert blob to File for uploadTrickPhoto
        const imageFile = new File([processed.blob], `image-${i}.jpg`, { type: processed.blob.type });
        const url = await uploadTrickPhoto(imageFile, user.id);
        uploadedUrls.push(url);
      }
      
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsProcessing(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Delete from storage if it's a storage URL
    if (imageUrl.includes('trick-photos')) {
      try {
        await deleteTrickPhoto(imageUrl);
      } catch (error) {
        console.error('Failed to delete image from storage:', error);
      }
    }
    
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Images (Optional - Max {MAX_IMAGES})</Label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-wrap gap-2">
          <SortableContext items={images} strategy={horizontalListSortingStrategy}>
            {images.map((imageUrl, index) => (
              <SortableImageItem
                key={imageUrl}
                id={imageUrl}
                imageUrl={imageUrl}
                index={index}
                onRemove={() => handleRemoveImage(index)}
                disabled={disabled || isProcessing}
              />
            ))}
          </SortableContext>
          
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
      </DndContext>
      {isProcessing && (
        <p className="text-xs text-muted-foreground">
          {uploadProgress || 'Processing...'}
        </p>
      )}
    </div>
  );
}
