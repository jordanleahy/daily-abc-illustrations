import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CoinCounter } from '@/components/ui/coin-counter';
import { BookImage } from '@/components/ui/book-image';
import { Edit2, Trash2, ShoppingCart, Check } from 'lucide-react';
import type { RewardsProduct } from '@/types/rewardsProduct';
import { formatCoinsAsCurrency } from '@/utils/currency';

interface ProductCardProps {
  product: RewardsProduct;
  mode: 'parent' | 'kid';
  canAfford?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onBuy?: () => void;
  isDeleting?: boolean;
  isPurchasing?: boolean;
}

export const ProductCard = ({
  product,
  mode,
  canAfford = false,
  onEdit,
  onDelete,
  onBuy,
  isDeleting = false,
  isPurchasing = false,
}: ProductCardProps) => {
  return (
    <Card className="overflow-hidden hover-scale">
      <div className="aspect-square relative bg-muted">
        {product.product_video_url ? (
          <video
            src={product.product_video_url}
            className="w-full h-full object-cover"
            controls
            playsInline
            loop
            muted
            autoPlay={false}
          />
        ) : product.product_image_url ? (
          <BookImage
            src={product.product_image_url}
            alt={product.title}
            className="w-full h-full object-cover"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}
        {!product.is_active && mode === 'parent' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary">Inactive</Badge>
          </div>
        )}
        {product.quantity_available === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">{product.title}</h3>
          {mode === 'kid' && canAfford && (
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <CoinCounter coins={product.coin_price} size="sm" showLabel={false} />
            <span className="text-xs text-muted-foreground">
              ({formatCoinsAsCurrency(product.coin_price)})
            </span>
          </div>

          {product.quantity_available !== null && (
            <Badge variant="outline" className="text-xs">
              {product.quantity_available} left
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        {mode === 'parent' ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEdit}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
          </>
        ) : (
          <Button
            className="w-full"
            onClick={onBuy}
            disabled={!canAfford || product.quantity_available === 0 || isPurchasing}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isPurchasing ? 'Purchasing...' : canAfford ? 'Buy Now' : 'Not Enough Coins'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
