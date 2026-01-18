import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LibraryUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle: string;
}

/**
 * LibraryUpgradeModal - Now prompts for free signup instead of upgrade
 */
export const LibraryUpgradeModal = ({ open, onOpenChange, bookTitle }: LibraryUpgradeModalProps) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    onOpenChange(false);
    navigate('/auth?mode=signup');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sign Up for Free Access
          </DialogTitle>
          <DialogDescription className="pt-4">
            Create a free account to access <span className="font-medium text-foreground">"{bookTitle}"</span> and all library books.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Free account includes:
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
            <Button onClick={handleSignUp} className="w-full" size="lg">
              Sign Up Free
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
