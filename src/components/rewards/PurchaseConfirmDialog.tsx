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
import { PointsCounter } from '@/components/ui/points-counter';
import type { RewardsProduct } from '@/types/rewardsProduct';
import { formatPoints } from '@/utils/currency';
import { ModalProps } from '@/types/shared';

interface PurchaseConfirmDialogProps extends ModalProps {
  product: RewardsProduct | null;
  currentPoints: number;
  onConfirm: () => void;
}

export const PurchaseConfirmDialog = ({
  open,
  onOpenChange,
  product,
  currentPoints,
  onConfirm,
}: PurchaseConfirmDialogProps) => {
  if (!product) return null;

  const remainingPoints = currentPoints - product.coin_price;

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
                <PointsCounter points={product.coin_price} size="sm" showLabel={false} />
              </div>

              <div className="flex justify-between items-center">
                <span>Your Balance:</span>
                <PointsCounter points={currentPoints} size="sm" showLabel={false} />
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">After Purchase:</span>
                <PointsCounter points={remainingPoints} size="sm" showLabel={false} />
              </div>

              {remainingPoints < 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-2">
                  <p className="text-destructive text-xs font-medium">
                    ⚠️ Insufficient points. You need {formatPoints(product.coin_price - currentPoints)} more.
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Your parent will be notified and will fulfill this reward for you.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={remainingPoints < 0}
          >
            Confirm Purchase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
