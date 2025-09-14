import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shimmer } from "@/components/ui/shimmer";
import { usePageImageUrls } from "@/hooks/usePageImageUrls";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
    return <Shimmer className="w-full h-32" />;
  }

  const hasPrompt = !!imagePrompt && imagePrompt !== "Generating image prompt...";
  const isGenerating = currentImage?.generation_status === 'in_progress';
  const hasImage = currentImage?.generation_status === 'complete' && currentImage?.image_url;
  const hasError = currentImage?.generation_status === 'error';

  return (
    <Card className="p-4 mt-2">
      <div className="space-y-4">
        {/* Prompt Section */}
        {hasPrompt && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Generated Prompt:</h4>
            <p className="text-sm text-muted-foreground">{imagePrompt}</p>
          </div>
        )}

        {/* Image Section */}
        <div className="space-y-3">
          {hasImage && currentImage?.image_url && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Generated Image:</h4>
              <img 
                src={currentImage.image_url} 
                alt="Generated page image"
                className="w-full max-w-xs rounded-lg border"
              />
              <div className="text-xs text-muted-foreground">
                Generated in {currentImage.generation_duration_ms}ms
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <Shimmer className="w-full h-32" />
              <p className="text-sm text-muted-foreground">Generating image...</p>
            </div>
          )}

          {hasError && (
            <div className="text-sm text-destructive">
              Error: {currentImage?.error_message || 'Failed to generate image'}
            </div>
          )}

          {!hasImage && !isGenerating && hasPrompt && (
            <Button 
              onClick={handleGenerateImage}
              disabled={!hasPrompt}
              size="sm"
            >
              Generate Image
            </Button>
          )}

          {!hasPrompt && !hasImage && !isGenerating && (
            <p className="text-sm text-muted-foreground">
              Generate a style guide first, then create image prompts for this page.
            </p>
          )}
        </div>

        {/* Version History */}
        {versions.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Version History ({versions.length})</h4>
            <div className="space-y-1">
              {versions.slice(0, 3).map((version) => (
                <div key={version.id} className="text-xs text-muted-foreground flex justify-between">
                  <span>v{version.version_number} - {version.generation_status}</span>
                  <span>{new Date(version.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {versions.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  ... and {versions.length - 3} more versions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}