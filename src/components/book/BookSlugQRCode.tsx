import { QrCode, Copy, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookSlugQRCode } from '@/hooks/useBookSlugQRCode';

interface BookSlugQRCodeProps {
  bookId: string;
}

export const BookSlugQRCode = ({ bookId }: BookSlugQRCodeProps) => {
  const {
    qrCodeData,
    generateQRCode,
    downloadQRCode,
    copyPublicUrl,
    hasQRCode,
    isGenerating
  } = useBookSlugQRCode(bookId);

  const { qrCodeImage, publicUrl, isLoading, error } = qrCodeData;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-48 h-48 bg-muted animate-pulse rounded-lg" />
        <div className="flex gap-2">
          <div className="w-24 h-10 bg-muted animate-pulse rounded" />
          <div className="w-20 h-10 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-48 h-48 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
          <QrCode className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={generateQRCode} disabled={isGenerating}>
          <QrCode className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Try Again'}
        </Button>
      </div>
    );
  }

  if (!hasQRCode) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-48 h-48 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
          <QrCode className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Generate a QR code for this book's landing page
        </p>
        <Button onClick={generateQRCode} disabled={isGenerating}>
          <QrCode className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate QR Code'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="w-48 h-48 bg-white rounded-lg p-4 border shadow-sm">
        {qrCodeImage ? (
          <img 
            src={qrCodeImage} 
            alt="Book Landing Page QR Code" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <QrCode className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
      </div>
      
      {publicUrl && (
        <p className="text-xs text-muted-foreground text-center max-w-[200px] truncate" title={publicUrl}>
          {publicUrl}
        </p>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={copyPublicUrl}
          disabled={!qrCodeImage}
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy Link
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadQRCode}
          disabled={!qrCodeImage}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        {publicUrl && (
          <Button 
            variant="outline" 
            size="sm"
            asChild
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Preview
            </a>
          </Button>
        )}
      </div>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={generateQRCode} 
        disabled={isGenerating}
        className="text-xs"
      >
        <QrCode className="h-3 w-3 mr-1" />
        {isGenerating ? 'Regenerating...' : 'Regenerate'}
      </Button>
    </div>
  );
};
