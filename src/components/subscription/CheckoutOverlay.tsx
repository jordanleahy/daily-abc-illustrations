import { Loader2 } from "lucide-react";

interface CheckoutOverlayProps {
  isOpen: boolean;
}

export const CheckoutOverlay = ({ isOpen }: CheckoutOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div>
          <p className="text-lg font-semibold">Opening Stripe checkout...</p>
          <p className="text-sm text-muted-foreground">You'll be redirected in a moment</p>
        </div>
      </div>
    </div>
  );
};
