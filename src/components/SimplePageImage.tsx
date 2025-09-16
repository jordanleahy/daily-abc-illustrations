import { usePageImageUrlsPublic } from "@/hooks/usePageImageUrlsPublic";

interface SimplePageImageProps {
  pageId: string;
  bookId: string;
}

export function SimplePageImage({ pageId, bookId }: SimplePageImageProps) {
  const { data: currentImage, isLoading } = usePageImageUrlsPublic(pageId);

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
        <div className="animate-pulse bg-muted-foreground/20 w-full h-full" />
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted">
      {currentImage?.image_url ? (
        <img
          src={currentImage.image_url}
          alt="Daily ABC page illustration"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            console.error('Image failed to load:', currentImage.image_url);
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No image</p>
        </div>
      )}
    </div>
  );
}