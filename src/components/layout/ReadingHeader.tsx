import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Circle, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useKidCoins } from '@/hooks/useKidCoins';
import { formatCoinsAsCurrency } from '@/utils/currency';

/**
 * ReadingHeader Component
 * 
 * A simplified, lightweight header component designed for reading experiences and
 * content-focused contexts where a minimal navigation interface is preferred over 
 * the full Header component. Ideal for focused user experiences like reading modes, 
 * editing interfaces, or specialized workflows.
 * 
 * Key Features:
 * - Minimal, distraction-free design
 * - Fixed positioning for persistent access during content interaction
 * - Basic back navigation functionality
 * - QR code sharing for content distribution
 * - Simplified title/subtitle display
 * 
 * Usage Guidelines:
 * - Use for content-focused pages where minimal navigation is desired
 * - Suitable for modal-like interfaces or specialized workflows  
 * - Prefer the main Header component for general application navigation
 * - Ideal for reading contexts like book viewing or content consumption
 * 
 * @component
 * @example
 * // Basic usage for content-focused pages
 * <ReadingHeader title="Reading Mode" />
 * 
 * @example
 * // With back navigation and sharing
 * <ReadingHeader
 *   title="Chapter 1"
 *   subtitle="The Beginning" 
 *   onBack={() => history.goBack()}
 *   bookId="book-123"
 *   showQRCode={true}
 * />
 * 
 * @example
 * // Minimal header for focused workflows
 * <ReadingHeader 
 *   title="Book Reader"
 *   showQRCode={false}
 * />
 */
interface ReadingHeaderProps {
  /** Header title text - defaults to "Library" */
  title?: string;
  /** Optional subtitle text displayed below the main title */
  subtitle?: string;
  /** Book ID for QR code generation and sharing functionality */
  bookId?: string;
  /** Whether to show the QR code sharing button */
  showQRCode?: boolean;
  /** Handler for back navigation - shows back button when provided */
  onBack?: () => void;
  /** Kid ID for displaying kid's name and coin balance */
  kidId?: string;
  /** Handler for previous page navigation */
  onPrevious?: () => void;
  /** Handler for next page navigation */
  onNext?: () => void;
  /** Whether previous navigation is available */
  hasPrevious?: boolean;
  /** Whether next navigation is available */
  hasNext?: boolean;
}

/**
 * ReadingHeader implementation providing a clean, focused navigation experience.
 * Uses fixed positioning for persistent access while maintaining a minimal
 * footprint to avoid interfering with content consumption.
 */
export function ReadingHeader({
  title = "Library",
  subtitle,
  bookId,
  showQRCode = true,
  onBack,
  kidId,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false
}: ReadingHeaderProps) {
  const { qrCodeData } = useBookQRCode(bookId || '');
  const navigate = useNavigate();
  const { data: kidProfiles } = useKidProfiles();
  const { kidCoins } = useKidCoins(kidId || '');
  
  // Find the kid to display
  const displayKid = kidId 
    ? kidProfiles?.find(k => k.id === kidId)
    : kidProfiles?.length === 1 
      ? kidProfiles[0] 
      : null;

  /** 
   * Handle title click for contextual navigation
   * Prioritizes custom back handler, falls back to library navigation
   */
  const handleTitleClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/library');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
      {/* Left section: Optional back navigation */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-8 rounded border border-border hover:bg-muted">
            <span className="text-xs">← Back</span>
          </Button>
        )}
      </div>
      
      {/* Center section: Kid info */}
      <div className="flex items-center gap-2 text-sm">
        {displayKid && (
          <>
            <span className="font-medium text-foreground">{displayKid.first_name}</span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <Circle className="w-3 h-3 fill-amber-600 text-amber-700" />
              <span className="text-amber-700 font-medium">{formatCoinsAsCurrency(kidCoins)}</span>
            </div>
          </>
        )}
      </div>
      
      {/* Right section: Content sharing controls */}
      <div className="flex items-center gap-2">
        {/* Page navigation arrows */}
        {(onPrevious || onNext) && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="p-1 h-8 w-8 rounded border border-border hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onNext}
              disabled={!hasNext}
              className="p-1 h-8 w-8 rounded border border-border hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
        
        {/* QR Code sharing functionality */}
        {showQRCode && bookId && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8 rounded border border-border hover:bg-muted">
                <QrCode className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Share to Share</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-64 h-64 rounded-lg flex items-center justify-center">
                  {qrCodeData.isLoading ? (
                    <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      <QrCode className="w-16 h-16 text-muted-foreground animate-pulse" />
                    </div>
                  ) : qrCodeData.qrCodeImage ? (
                    <img 
                      src={qrCodeData.qrCodeImage} 
                      alt="QR Code for sharing this content"
                      className="w-64 h-64 rounded-lg"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      <QrCode className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}