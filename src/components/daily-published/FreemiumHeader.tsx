import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { PublicPageImage } from './PublicPageImage';
import type { Page } from '@/types/book';

interface FreemiumHeaderProps {
  title?: string;
  timeRemaining?: string;
  previousPage?: Page;
  onPrevious?: () => void;
  bookId: string;
  pageNumber?: number;
  totalPages?: number;
  showQRCode?: boolean;
  showPageIndicator?: boolean;
}

export function FreemiumHeader({
  title = "Schedule",
  timeRemaining,
  previousPage,
  onPrevious,
  bookId,
  pageNumber,
  totalPages,
  showQRCode = true,
  showPageIndicator = true
}: FreemiumHeaderProps) {
  const { qrCodeData } = useBookQRCode(bookId);
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
      {/* Left section: Timer and back button */}
      <div className="flex items-center gap-3">
        {timeRemaining && (
          <div className="text-sm font-medium text-muted-foreground">
            {timeRemaining}
          </div>
        )}
        
        {/* Previous page back button */}
        {previousPage && onPrevious && (
          <Button variant="ghost" size="sm" onClick={onPrevious} className="p-1 h-8 w-8 rounded border border-border hover:bg-muted">
            <div className="w-6 h-6 bg-muted rounded-sm overflow-hidden">
              <PublicPageImage pageId={previousPage.id} bookId={bookId} />
            </div>
          </Button>
        )}
      </div>
      
      {/* Middle section: Title */}
      <div 
        className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
        onClick={() => navigate('/schedule')}
      >
        {title}
      </div>
      
      {/* Right section: QR button and page indicator */}
      <div className="flex items-center gap-2">
        {/* QR Code Button */}
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
        
        {/* Page indicator */}
        {showPageIndicator && pageNumber && totalPages && (
          <div className="text-xs text-muted-foreground font-medium">
            Page {pageNumber} of {totalPages}
          </div>
        )}
      </div>
    </div>
  );
}