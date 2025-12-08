import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";

interface ScreenTimeExpiredModalProps {
  open: boolean;
  onDismiss: (navigateTo: '/' | '/habits') => void;
}

export const ScreenTimeExpiredModal = ({ open, onDismiss }: ScreenTimeExpiredModalProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Great Job Watching!</DialogTitle>
          <DialogDescription className="text-base">
            Your screen time is finished. Complete your habits to earn more coins for videos!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            onClick={() => onDismiss('/habits')} 
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Do Habits
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onDismiss('/')}
            className="w-full"
          >
            Go Home
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
