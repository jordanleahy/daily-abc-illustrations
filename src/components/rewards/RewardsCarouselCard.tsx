import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { RewardsProduct } from '@/types/rewardsProduct';
import { formatCoinsAsCurrency } from '@/utils/currency';

interface RewardsCarouselCardProps {
  product: RewardsProduct;
  onClick: () => void;
}

export const RewardsCarouselCard = memo(({ product, onClick }: RewardsCarouselCardProps) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <AspectRatio ratio={1/1} className="shadow-md hover:shadow-xl transition-shadow duration-300">
          {product.product_image_url ? (
            <img
              src={product.product_image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-4xl">🎁</span>
            </div>
          )}
        </AspectRatio>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2">
            {product.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {formatCoinsAsCurrency(product.coin_price)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});

RewardsCarouselCard.displayName = 'RewardsCarouselCard';
