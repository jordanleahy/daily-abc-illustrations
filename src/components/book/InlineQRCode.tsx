import { useBookQRCode } from '@/hooks/useBookQRCode';
import { Button } from '@/components/ui/button';
import { Copy, QrCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface InlineQRCodeProps {
  bookId: string;
}

export const InlineQRCode = ({ bookId }: InlineQRCodeProps) => {
  const { qrCodeData, generateQRCode, copyPublicUrl, hasQRCode, isGenerating } = useBookQRCode(bookId);

  if (qrCodeData.isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="w-24 h-24" />
        <div className="flex gap-2">
          <Skeleton className="w-20 h-8" />
          <Skeleton className="w-20 h-8" />
        </div>
      </div>
    );
  }

  if (qrCodeData.error) {
    return (
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <QrCode className="w-8 h-8" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Copy Link
          </Button>
          <Button variant="outline" size="sm" disabled>
            Generate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {hasQRCode ? (
        <img 
          src={qrCodeData.qrCodeImage} 
          alt="QR Code" 
          className="w-24 h-24 border rounded"
        />
      ) : (
        <div className="w-24 h-24 border rounded flex items-center justify-center bg-muted">
          <QrCode className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyPublicUrl}
          disabled={!hasQRCode}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={generateQRCode}
          disabled={isGenerating}
        >
          <QrCode className="w-3 h-3 mr-1" />
          Generate
        </Button>
      </div>
    </div>
  );
};