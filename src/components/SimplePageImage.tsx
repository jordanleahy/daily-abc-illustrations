import { usePageImageUrls } from "@/hooks/usePageImageUrls";
import { Shimmer } from "@/components/ui/shimmer";

interface SimplePageImageProps {
  pageId: string;
  bookId: string;
}

export function SimplePageImage({ pageId, bookId }: SimplePageImageProps) {
  const { currentImage, isLoading } = usePageImageUrls(pageId);

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <Shimmer className="w-full h-full" />
      </div>
    );
  }

  const hasImage = currentImage?.generation_status === 'complete' && currentImage?.image_url;
  const isGenerating = currentImage?.generation_status === 'in_progress';

  if (hasImage && currentImage?.image_url) {
    return (
      <img 
        src={currentImage.image_url} 
        alt="Page illustration"
        className="w-full h-full object-cover"
      />
    );
  }

  if (isGenerating) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Shimmer className="w-16 h-16" />
          <p className="text-xs text-muted-foreground">Generating...</p>
        </div>
      </div>
    );
  }

  // No image available - show placeholder
  return (
    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
      <p className="text-xs text-muted-foreground">No image</p>
    </div>
  );
}