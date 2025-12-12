import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { RewardsProduct } from '@/types/rewardsProduct';
import { formatPenniesAsCurrency } from '@/utils/currency';
import { Smartphone } from 'lucide-react';

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
        <AspectRatio ratio={1/1} className="shadow-md hover:shadow-xl transition-shadow duration-300 bg-muted">
          {product.product_image_url ? (
            <img
              src={product.product_image_url}
              alt={product.title}
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative">
                <Smartphone className="w-16 h-24 text-muted-foreground" strokeWidth={1.5} />
                <div className="absolute inset-0 flex items-center justify-center mt-1">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500 fill-current">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </AspectRatio>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2">
            {product.title}
          </h3>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {formatPenniesAsCurrency(product.coin_price)}
            </Badge>
            {product.quantity_available !== null && (
              <span className="text-sm font-medium">
                {product.quantity_available} out of 100
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

RewardsCarouselCard.displayName = 'RewardsCarouselCard';
