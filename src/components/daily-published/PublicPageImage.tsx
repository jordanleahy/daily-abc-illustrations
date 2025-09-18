import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { Shimmer } from '@/components/ui/shimmer';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { commonBlurDataUrls } from '@/utils/blurDataUrl';

interface PublicPageImageProps {
  pageId: string;
  bookId: string;
  className?: string;
}

export function PublicPageImage({ pageId, bookId, className = "" }: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);

  if (isLoading) {
    return <Shimmer className={`w-full h-full ${className}`} />;
  }

  if (!imageData?.image_url) {
    return (
      <div className={`w-full h-full bg-muted/50 flex items-center justify-center ${className}`}>
        <div className="text-xs text-muted-foreground">No image</div>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={imageData.image_url}
      alt="Page illustration"
      className={`w-full h-full object-cover object-top ${className}`}
      shimmerVariant="blur-up"
      showProgress={true}
      blurDataURL={commonBlurDataUrls.neutral}
      rootMargin="100px"
    />
  );
}