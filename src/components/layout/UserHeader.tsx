import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookQRCode } from '@/hooks/useBookQRCode';

interface UserHeaderProps {
  title?: string;
  subtitle?: string;
  bookId?: string;
  showQRCode?: boolean;
  onBack?: () => void;
}

export function UserHeader({
  title = "Library",
  subtitle,
  bookId,
  showQRCode = true,
  onBack
}: UserHeaderProps) {
  const { qrCodeData } = useBookQRCode(bookId || '');
  const navigate = useNavigate();

  const handleTitleClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/library');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
      {/* Left section: Back navigation */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-8 rounded border border-border hover:bg-muted">
            <span className="text-xs">← Back</span>
          </Button>
        )}
      </div>
      
      {/* Middle section: Title and subtitle */}
      <div className="flex flex-col items-center">
        <div 
          className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={handleTitleClick}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      
      {/* Right section: QR button */}
      <div className="flex items-center gap-2">
        {/* QR Code Button */}
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