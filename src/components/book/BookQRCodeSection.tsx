import { QrCode, Download, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { QRCodeDisplayStatus } from '@/types/bookQRCode';

interface BookQRCodeSectionProps {
  bookId: string;
}

const getStatusBadge = (status: QRCodeDisplayStatus, queuePosition?: number) => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    case 'queued':
      return <Badge variant="secondary">Queued (#{queuePosition})</Badge>;
    case 'expired':
      return <Badge variant="destructive">Expired</Badge>;
    case 'draft':
      return <Badge variant="outline">Draft</Badge>;
    case 'not_published':
      return <Badge variant="outline">Not Published</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusMessage = (status: QRCodeDisplayStatus, queuePosition?: number) => {
  switch (status) {
    case 'active':
      return 'This QR code links to your live daily published content.';
    case 'queued':
      return `This book is queued for publication at position #${queuePosition}.`;
    case 'expired':
      return 'This content has expired and is no longer active.';
    case 'draft':
      return 'This content is in draft mode and requires authentication to view.';
    case 'not_published':
      return 'This book has not been published to the daily queue yet.';
    default:
      return '';
  }
};

export const BookQRCodeSection = ({ bookId }: BookQRCodeSectionProps) => {
  const {
    qrCodeData,
    generateQRCode,
    downloadQRCode,
    copyPublicUrl,
    hasQRCode,
    isGenerating
  } = useBookQRCode(bookId);

  const { qrCodeImage, publicUrl, status, queuePosition, isLoading, error } = qrCodeData;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle>QR Code</CardTitle>
          </div>
          <CardDescription>Generate and manage QR codes for your book</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-64 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle>QR Code</CardTitle>
          </div>
          <CardDescription>Generate and manage QR codes for your book</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Error: {error}</p>
            <Button onClick={generateQRCode} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasQRCode) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle>QR Code</CardTitle>
          </div>
          <CardDescription>Generate a QR code for your book</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Generate a QR code to easily share your book
            </p>
            <Button onClick={generateQRCode} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle>QR Code</CardTitle>
          </div>
          {getStatusBadge(status, queuePosition)}
        </div>
        <CardDescription>
          {getStatusMessage(status, queuePosition)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Image */}
        <div className="flex justify-center">
          {qrCodeImage ? (
            <div className="bg-white p-4 rounded-lg border">
              <img 
                src={qrCodeImage} 
                alt="QR Code" 
                className="w-64 h-64"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Public URL */}
        {publicUrl && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Public URL</label>
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                {publicUrl}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyPublicUrl}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(publicUrl, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={downloadQRCode} 
            disabled={!qrCodeImage}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
          <Button 
            variant="outline" 
            onClick={generateQRCode}
            disabled={isGenerating}
          >
            {isGenerating ? 'Updating...' : 'Regenerate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};