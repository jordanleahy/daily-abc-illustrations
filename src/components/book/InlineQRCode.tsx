import { useBookQRCode } from '@/hooks/useBookQRCode';
import { Button } from '@/components/ui/button';
import { Copy, QrCode, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InlineQRCodeProps {
  bookId: string;
}

export const InlineQRCode = ({ bookId }: InlineQRCodeProps) => {
  const navigate = useNavigate();
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

  // Show helpful message if book not in publishing queue
  if (qrCodeData.status === 'not_published') {
    return (
      <Alert className="w-64">
        <Calendar className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <p className="font-medium mb-1">QR Code Not Available</p>
          <p className="text-xs mb-2">Add this book to the publishing schedule to generate a shareable QR code.</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/schedule')}
            className="w-full"
          >
            Go to Schedule
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (qrCodeData.error) {
    return (
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <QrCode className="w-8 h-8" />
        <p className="text-xs text-center">Error loading QR code</p>
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