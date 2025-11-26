import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useUploadTrickMedia } from '@/hooks/useUploadTrickMedia';
import { extractExifData } from '@/utils/exifExtractor';
import { toast } from 'sonner';
import { GeolocationData } from '@/types/trickMedia';
import { generateThumbnail } from '@/utils/videoThumbnail';

interface TrickUploadZoneProps {
  trickId: string;
  goalId?: string;
  kidProfileId?: string;
  attemptNumber?: number;
  onUploadComplete?: () => void;
}

export const TrickUploadZone = ({
  trickId,
  goalId,
  kidProfileId,
  attemptNumber,
  onUploadComplete,
}: TrickUploadZoneProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingThumbnail, setPendingThumbnail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadTrickMedia();

  const getDeviceLocation = (): Promise<GeolocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve(null);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !kidProfileId) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    // For videos, generate thumbnail immediately (non-blocking)
    if (isVideo) {
      try {
        const video = document.createElement('video');
        const videoObjectUrl = URL.createObjectURL(file);
        video.src = videoObjectUrl;
        
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });
        
        const thumbnailBlob = await generateThumbnail(video);
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
        setPendingThumbnail(thumbnailUrl);
        
        // Cleanup video element and object URL
        URL.revokeObjectURL(videoObjectUrl);
        video.src = '';
        video.load();
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
      }
    }

    setIsProcessing(true);

    try {
      // Extract EXIF data (date + GPS)
      const exifData = await extractExifData(file);
      
      let location: GeolocationData | undefined;
      
      // If EXIF has GPS, use it
      if (exifData.location) {
        location = {
          latitude: exifData.location.latitude,
          longitude: exifData.location.longitude,
          accuracy: 0, // EXIF GPS doesn't provide accuracy
        };
      } else {
        // Fallback to device geolocation
        const deviceLocation = await getDeviceLocation();
        if (deviceLocation) {
          location = deviceLocation;
        }
      }

      // Fire-and-forget: Upload in background
      uploadMedia.mutate(
        {
          trick_id: trickId,
          trick_goal_id: goalId,
          kid_profile_id: kidProfileId,
          media_file: file,
          captured_at: exifData.capturedAt || undefined,
          location,
          attempt_number: attemptNumber,
        },
        {
          onSuccess: () => {
            setPendingThumbnail(null);
            setIsProcessing(false);
            onUploadComplete?.();
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          },
          onError: () => {
            setPendingThumbnail(null);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('Failed to process file');
      setPendingThumbnail(null);
      setIsProcessing(false);
    }
  };

  const handleTap = () => {
    if (!kidProfileId) {
      toast.error('No kid profile selected');
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleTap}
      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
    >
      {pendingThumbnail ? (
        <div className="relative inline-block">
          <img 
            src={pendingThumbnail} 
            alt="Uploading video" 
            className="w-16 h-16 rounded-lg object-cover"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : isProcessing ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <span className="text-sm text-muted-foreground mt-1 block">
            Uploading...
          </span>
        </>
      ) : (
        <>
          <Camera className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Tap to upload progress
          </span>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
