import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CoinCounter } from '@/components/ui/coin-counter';
import type { RewardsProduct } from '@/types/rewardsProduct';
import { formatCoinsAsCurrency } from '@/utils/currency';

interface PurchaseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: RewardsProduct | null;
  currentCoins: number;
  onConfirm: () => void;
}

export const PurchaseConfirmDialog = ({
  open,
  onOpenChange,
  product,
  currentCoins,
  onConfirm,
}: PurchaseConfirmDialogProps) => {
  if (!product) return null;

  const remainingCoins = currentCoins - product.coin_price;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="space-y-2">
              <p className="text-foreground font-medium">{product.title}</p>
              {product.product_image_url && (
                <img
                  src={product.product_image_url}
                  alt={product.title}
                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Cost:</span>
                <div className="flex items-center gap-2">
                  <CoinCounter coins={product.coin_price} size="sm" showLabel={false} />
                  <span className="text-muted-foreground">
                    ({formatCoinsAsCurrency(product.coin_price)})
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Your Balance:</span>
                <CoinCounter coins={currentCoins} size="sm" showLabel={false} />
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">After Purchase:</span>
                <CoinCounter coins={remainingCoins} size="sm" showLabel={false} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your parent will be notified and will fulfill this reward for you.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirm Purchase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
