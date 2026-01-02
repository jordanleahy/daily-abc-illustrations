import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { usePublicBookQRCode } from '@/hooks/usePublicBookQRCode';
import { toast } from 'sonner';

interface PublicBookShareDrawerProps {
  bookId: string;
  bookTitle: string;
  publicUrl: string;
}

export function PublicBookShareDrawer({ bookId, bookTitle, publicUrl }: PublicBookShareDrawerProps) {
  const { data: qrData } = usePublicBookQRCode(bookId);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookTitle,
          text: `Check out "${bookTitle}" - a fun ABC book!`,
          url: publicUrl,
        });
      } catch (err) {
        // User cancelled or error - silently ignore
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const hasPreGeneratedQR = !!(qrData?.qr_code_image);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full h-12 gap-2 sm:w-auto sm:h-auto sm:px-3 sm:py-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center">
            <DrawerTitle>Share This Book</DrawerTitle>
            <DrawerDescription>
              Scan the QR code or share the link
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-0">
            {/* QR Code Display */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                {hasPreGeneratedQR ? (
                  <img 
                    src={qrData.qr_code_image!} 
                    alt={`QR code for ${bookTitle}`}
                    className="w-48 h-48"
                  />
                ) : (
                  <QRCodeSVG 
                    value={publicUrl}
                    size={192}
                    level="M"
                    includeMargin={false}
                  />
                )}
              </div>
            </div>

            {/* URL Display */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
              <p className="text-sm text-muted-foreground truncate flex-1">
                {publicUrl}
              </p>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy Link
              </Button>
              
              {hasNativeShare && (
                <Button onClick={handleNativeShare} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Share via...
                </Button>
              )}
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
