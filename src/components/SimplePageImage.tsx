import { usePageImageUrlsPublic } from "@/hooks/usePageImageUrlsPublic";

interface SimplePageImageProps {
  pageId: string;
  bookId: string;
}

export function SimplePageImage({ pageId, bookId }: SimplePageImageProps) {
  const { data: currentImage, isLoading } = usePageImageUrlsPublic(pageId);

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <div className="animate-pulse bg-muted-foreground/20 w-full h-full rounded-lg" />
      </div>
    );
  }

  if (currentImage?.image_url) {
    return (
      <img 
        src={currentImage.image_url} 
        alt="Page illustration"
        className="w-full h-full object-cover rounded-lg"
        onError={(e) => {
          console.error('Image failed to load:', currentImage.image_url);
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // No image available - show placeholder
  return (
    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
      <p className="text-xs text-muted-foreground">No image</p>
    </div>
  );
}