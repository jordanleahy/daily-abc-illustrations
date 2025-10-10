import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ImageUpload';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';

interface PageImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  bookId: string;
}

export function PageImageUploadModal({ 
  open, 
  onOpenChange, 
  pageId,
  bookId 
}: PageImageUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { uploadImage } = usePageImageUrls(pageId);

  const handleImageSelect = async (file: File) => {
    setIsUploading(true);
    
    try {
      await uploadImage(file, bookId);
      toast.success('Image uploaded successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Page Image</DialogTitle>
          <DialogDescription>
            Select a square image (1:1 aspect ratio) to upload. Max 5MB.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <ImageUpload 
            onImageSelect={handleImageSelect}
            disabled={isUploading}
            className="h-64"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
