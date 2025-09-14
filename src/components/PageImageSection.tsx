import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shimmer } from "@/components/ui/shimmer";
import { usePageImageUrls } from "@/hooks/usePageImageUrls";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProcessStatus } from "@/types/process";

interface PageImageSectionProps {
  pageId: string;
  bookId: string;
  imagePrompt?: string;
}

export function PageImageSection({ pageId, bookId, imagePrompt }: PageImageSectionProps) {
  const { user } = useAuth();
  const { currentImage, versions, isLoading, createImageRecord, refreshData } = usePageImageUrls(pageId);

  const handleGenerateImage = async () => {
    if (!user || !imagePrompt) return;

    try {
      // Create image record
      const record = await createImageRecord(bookId, imagePrompt);
      if (!record) {
        throw new Error('Failed to create image record');
      }

      // Start image generation
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          recordId: record.id,
          userId: user.id
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate image');

      toast.success('Image generated successfully!');
      refreshData();
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'Failed to generate image');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <Shimmer className="w-full h-full" />
      </div>
    );
  }

  const hasPrompt = !!imagePrompt && imagePrompt !== "Generating image prompt...";
  const isGenerating = currentImage?.generation_status === 'in_progress';
  const hasImage = currentImage?.generation_status === 'complete' && currentImage?.image_url;
  const hasError = currentImage?.generation_status === 'error';

  return (
    <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden">
      {hasImage && currentImage?.image_url ? (
        // Show generated image
        <div className="relative w-full h-full">
          <img 
            src={currentImage.image_url} 
            alt="Generated page image"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
            v{currentImage.version_number} • {currentImage.generation_duration_ms}ms
          </div>
        </div>
      ) : isGenerating ? (
        // Show generating state
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <Shimmer className="w-16 h-16" />
          <p className="text-sm text-muted-foreground">Generating image...</p>
          {currentImage?.generation_started_at && (
            <p className="text-xs text-muted-foreground">
              Started {new Date(currentImage.generation_started_at).toLocaleTimeString()}
            </p>
          )}
        </div>
      ) : hasError ? (
        // Show error state
        <div className="flex flex-col items-center justify-center h-full space-y-2 p-4 text-center">
          <p className="text-sm text-destructive font-medium">Generation Failed</p>
          <p className="text-xs text-muted-foreground">
            {currentImage?.error_message || 'Unknown error occurred'}
          </p>
          {hasPrompt && (
            <Button 
              onClick={handleGenerateImage}
              size="sm"
              variant="outline"
            >
              Try Again
            </Button>
          )}
        </div>
      ) : hasPrompt ? (
        // Show ready to generate state
        <div className="flex flex-col items-center justify-center h-full space-y-3 p-4 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">Prompt Ready</p>
            <p className="text-xs text-muted-foreground line-clamp-3">
              {imagePrompt.substring(0, 120)}...
            </p>
          </div>
          <Button 
            onClick={handleGenerateImage}
            size="sm"
            className="w-full"
          >
            Generate Image
          </Button>
        </div>
      ) : (
        // Show initial state
        <div className="flex flex-col items-center justify-center h-full space-y-2 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Generate a style guide first, then create image prompts for this page.
          </p>
        </div>
      )}

      {/* Version History Indicator */}
      {versions.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {versions.length} versions
        </div>
      )}
    </div>
  );
}