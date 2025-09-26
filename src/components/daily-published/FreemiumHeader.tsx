import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { PublicPageImage } from './PublicPageImage';
import type { Page } from '@/types/book';

/**
 * FreemiumHeader Component
 * 
 * A specialized header component designed for public/unauthenticated users viewing 
 * daily published content. This header provides a freemium experience with time-limited 
 * access indicators, navigation controls, and social sharing capabilities.
 * 
 * Key Features:
 * - Time remaining countdown display for limited access
 * - Visual navigation with page thumbnails  
 * - QR code sharing functionality
 * - Page progress indicators
 * - Fixed positioning for persistent visibility during content consumption
 * 
 * @component
 * @example
 * // Basic usage for daily published content
 * <FreemiumHeader 
 *   title="Daily ABC Story"
 *   timeRemaining="2:30 remaining"
 *   bookId="book-123"
 *   pageNumber={3}
 *   totalPages={26}
 * />
 * 
 * @example  
 * // With previous page navigation
 * <FreemiumHeader
 *   title="Letter Adventures" 
 *   previousPage={previousPageData}
 *   onPrevious={() => goToPreviousPage()}
 *   bookId="book-456"
 * />
 */
interface FreemiumHeaderProps {
  /** Header title text - defaults to "Schedule" */
  title?: string;
  /** Time remaining text for freemium access limitations */
  timeRemaining?: string;  
  /** Previous page data for back navigation with thumbnail */
  previousPage?: Page;
  /** Handler for previous page navigation */
  onPrevious?: () => void;
  /** Book ID for QR code generation and sharing */
  bookId: string;
  /** Whether to show the QR code sharing button */
  showQRCode?: boolean;
}

/**
 * FreemiumHeader implementation providing a user-friendly header for public content access.
 * Uses fixed positioning to remain visible during content scrolling and provides essential
 * navigation and sharing controls for the freemium user experience.
 */
export function FreemiumHeader({
  title = "Schedule",
  timeRemaining,
  previousPage,
  onPrevious,
  bookId,
  showQRCode = true
}: FreemiumHeaderProps) {
  const { qrCodeData } = useBookQRCode(bookId);
  const navigate = useNavigate();

  // Handle title click to navigate to schedule page
  const handleTitleClick = () => navigate('/schedule');

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
      {/* Left section: Timer and back navigation */}
      <div className="flex items-center gap-3">
        {/* Freemium access timer - shows remaining time for limited access */}
        {timeRemaining && (
          <div className="text-sm font-medium text-muted-foreground">
            {timeRemaining}
          </div>
        )}
      </div>
      
      {/* Middle section: Clickable title for navigation */}
      <div 
        className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
        onClick={handleTitleClick}
      >
        {title}
      </div>
      
      {/* Right section: Navigation and sharing controls */}
      <div className="flex items-center gap-2">
        {/* Previous page navigation with visual thumbnail preview */}
        {previousPage && onPrevious && (
          <Button variant="ghost" size="sm" onClick={onPrevious} className="p-1 h-8 w-8 rounded border border-border hover:bg-muted">
            <div className="w-6 h-6 bg-muted rounded-sm overflow-hidden">
              <PublicPageImage pageId={previousPage.id} bookId={bookId} />
            </div>
          </Button>
        )}
        
        {/* QR Code sharing functionality */}
        {showQRCode && (
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