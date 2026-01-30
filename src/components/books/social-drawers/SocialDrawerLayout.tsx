import { ReactNode, ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter 
} from '@/components/ui/drawer';
import { ExternalLink } from 'lucide-react';

interface SocialDrawerLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  children: ReactNode;
  actionLabel: string;
  actionLoadingLabel?: string;
  isActionLoading?: boolean;
  onAction?: () => void;
  showAction?: boolean;
}

/**
 * Shared layout component for all social media post drawers
 * Provides consistent header, footer, and close behavior
 */
export function SocialDrawerLayout({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
  actionLabel,
  actionLoadingLabel = 'Saving...',
  isActionLoading = false,
  onAction,
  showAction = true,
}: SocialDrawerLayoutProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAction?.();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Icon className={iconClassName || "h-5 w-5"} />
            {title}
          </DrawerTitle>
          <DrawerDescription>
            {description}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto flex-1">
          {children}
        </div>

        <DrawerFooter className="pt-4">
          {showAction && onAction && (
            <Button
              onClick={handleAction}
              disabled={isActionLoading}
              className="w-full gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {isActionLoading ? actionLoadingLabel : actionLabel}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
