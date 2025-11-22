import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUploadTrickMedia } from '@/hooks/useUploadTrickMedia';
import { toast } from 'sonner';

interface TrickMediaUploadButtonProps {
  trickId: string;
  kidProfileId: string;
  className?: string;
}

export function TrickMediaUploadButton({ 
  trickId, 
  kidProfileId,
  className = "" 
}: TrickMediaUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { requestLocation, isLoading: isLocationLoading } = useGeolocation();
  const uploadMedia = useUploadTrickMedia();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Request location
      toast.info('Getting location...');
      const location = await requestLocation();
      
      if (!location) {
        toast.warning('Location not available, uploading without location data');
      }

      // Upload with location data
      await uploadMedia.mutateAsync({
        trick_id: trickId,
        kid_profile_id: kidProfileId,
        media_file: file,
        location: location || undefined,
      });

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isProcessing = isUploading || isLocationLoading || uploadMedia.isPending;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleUploadClick}
        disabled={isProcessing}
        className={className}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </>
        )}
      </Button>
    </>
  );
}
