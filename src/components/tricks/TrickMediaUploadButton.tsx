import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUploadTrickMedia } from '@/hooks/useUploadTrickMedia';
import { extractExifData } from '@/utils/exifExtractor';
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
    toast.info('Uploading...');

    try {
      // Start metadata extraction in background (non-blocking)
      const metadataPromise = (async () => {
        let location = null;
        let capturedAt = null;

        // Extract EXIF data from image
        if (file.type.startsWith('image/')) {
          try {
            const exifData = await extractExifData(file);
            if (exifData.location) {
              location = {
                latitude: exifData.location.latitude,
                longitude: exifData.location.longitude,
                accuracy: 0
              };
            }
            capturedAt = exifData.capturedAt;
          } catch (error) {
            console.warn('EXIF extraction failed:', error);
          }
        }

        // If no EXIF GPS data, try device location
        if (!location) {
          try {
            location = await requestLocation();
          } catch (error) {
            console.warn('Location request failed:', error);
          }
        }

        return { location, capturedAt };
      })();

      // Upload immediately without waiting for metadata
      await uploadMedia.mutateAsync({
        trick_id: trickId,
        kid_profile_id: kidProfileId,
        media_file: file,
        captured_at: undefined,
        location: undefined,
      });

      // Try to get metadata quickly (with timeout)
      const metadata = await Promise.race([
        metadataPromise,
        new Promise<{ location: null; capturedAt: null }>((resolve) => 
          setTimeout(() => resolve({ location: null, capturedAt: null }), 100)
        )
      ]);

      // If we got metadata quickly, we could update the record here
      // For now, just log it since the upload is already complete
      if (metadata.location || metadata.capturedAt) {
        console.log('Metadata captured:', metadata);
      }

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
            Upload Progress
          </>
        )}
      </Button>
    </>
  );
}
