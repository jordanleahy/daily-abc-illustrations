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
import { ExternalLink, Send, Loader2 } from 'lucide-react';
import { SocialImageGallery } from './SocialImageGallery';

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
  // Outstand integration
  onOutstandPost?: () => void;
  isOutstandPosting?: boolean;
  outstandLabel?: string;
  // Image gallery
  bookId?: string;
  selectedMediaUrls?: string[];
  onMediaSelectionChange?: (urls: string[]) => void;
  maxMediaSelection?: number;
}

/**
 * Shared layout component for all social media post drawers
 * Provides consistent header, footer, and close behavior
 * Supports both manual posting and Outstand.so integration
 * Optionally renders an image gallery when bookId is provided
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
  onOutstandPost,
  isOutstandPosting = false,
  outstandLabel = 'Post with Outstand',
  bookId,
  selectedMediaUrls,
  onMediaSelectionChange,
  maxMediaSelection = 20,
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

  const handleOutstandPost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOutstandPost?.();
  };

  const isAnyLoading = isActionLoading || isOutstandPosting;

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

          {bookId && selectedMediaUrls && onMediaSelectionChange && (
            <SocialImageGallery
              bookId={bookId}
              selectedUrls={selectedMediaUrls}
              onSelectionChange={onMediaSelectionChange}
              maxSelection={maxMediaSelection}
            />
          )}
        </div>

        <DrawerFooter className="pt-4 space-y-2">
          {/* Primary action: Post with Outstand */}
          {onOutstandPost && (
            <Button
              onClick={handleOutstandPost}
              disabled={isAnyLoading}
              className="w-full gap-2"
            >
              {isOutstandPosting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isOutstandPosting ? 'Posting...' : outstandLabel}
            </Button>
          )}
          
          {/* Secondary action: Mark as manually posted */}
          {showAction && onAction && (
            <Button
              variant={onOutstandPost ? "secondary" : "default"}
              onClick={handleAction}
              disabled={isAnyLoading}
              className="w-full gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {isActionLoading ? actionLoadingLabel : actionLabel}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isAnyLoading}
            className="w-full"
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
