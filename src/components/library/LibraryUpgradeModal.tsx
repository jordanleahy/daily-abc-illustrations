import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LibraryUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle: string;
}

export const LibraryUpgradeModal = ({ open, onOpenChange, bookTitle }: LibraryUpgradeModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Unlock Full Library Access
          </DialogTitle>
          <DialogDescription className="pt-4">
            <span className="font-medium text-foreground">"{bookTitle}"</span> is part of our premium library.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Upgrade to Chairlift Plus to unlock:
          </p>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Full library access to all ABC books</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Download PDF versions</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Habits & Rewards system</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Track reading progress</span>
            </li>
          </ul>

          <div className="pt-4 space-y-2">
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              Upgrade to Plus
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full">
              Continue browsing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
