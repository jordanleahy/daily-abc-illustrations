import { QrCode, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { toast } from 'sonner';

interface BookQRCodeSectionProps {
  bookId: string;
}

export const BookQRCodeSection = ({ bookId }: BookQRCodeSectionProps) => {
  const {
    qrCodeData,
    generateQRCode,
    copyPublicUrl,
    hasQRCode,
    isGenerating
  } = useBookQRCode(bookId);

  const { qrCodeImage, isLoading, error } = qrCodeData;

  const handleCopyUrl = async () => {
    try {
      await copyPublicUrl();
      toast.success('URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

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
        <div className="w-48 h-48 bg-muted/50 rounded-lg flex items-center justify-center">
          <QrCode className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={generateQRCode} disabled={isGenerating}>
            <QrCode className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>
    );
  }

  if (!hasQRCode) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-48 h-48 bg-muted/50 rounded-lg flex items-center justify-center">
          <QrCode className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={generateQRCode} disabled={isGenerating}>
            <QrCode className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="w-48 h-48 bg-white rounded-lg p-4 border">
        {qrCodeImage ? (
          <img 
            src={qrCodeImage} 
            alt="QR Code" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <QrCode className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={handleCopyUrl}
          disabled={!qrCodeImage}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
        <Button 
          onClick={generateQRCode} 
          disabled={isGenerating}
        >
          <QrCode className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>
    </div>
  );
};