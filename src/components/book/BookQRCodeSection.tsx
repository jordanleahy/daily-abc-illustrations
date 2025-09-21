import { QrCode, Download, Copy, ExternalLink, CheckCircle, Clock, AlertTriangle, FileX, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { QRCodeDisplayStatus } from '@/types/bookQRCode';
import { toast } from 'sonner';

interface BookQRCodeSectionProps {
  bookId: string;
}

const getStatusBadge = (status: QRCodeDisplayStatus, queuePosition?: number) => {
  const getIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3" />;
      case 'queued':
        return <Clock className="h-3 w-3" />;
      case 'expired':
        return <AlertTriangle className="h-3 w-3" />;
      case 'draft':
      case 'not_published':
        return <FileX className="h-3 w-3" />;
      default:
        return null;
    }
  };

  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-500 text-white gap-1">
          {getIcon()}
          Live
        </Badge>
      );
    case 'queued':
      return (
        <Badge variant="secondary" className="gap-1">
          {getIcon()}
          Queued (#{queuePosition})
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="destructive" className="gap-1">
          {getIcon()}
          Expired
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="outline" className="gap-1">
          {getIcon()}
          Draft
        </Badge>
      );
    case 'not_published':
      return (
        <Badge variant="outline" className="gap-1">
          {getIcon()}
          Not Published
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          {getIcon()}
          {status}
        </Badge>
      );
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
      <Section variant="compact">
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode className="h-6 w-6 text-primary animate-pulse" />
              <CardTitle className="text-xl">QR Code</CardTitle>
            </div>
            <CardDescription>Loading QR code data...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <AspectRatio ratio={1} className="w-64">
                <Skeleton className="h-full w-full rounded-lg" />
              </AspectRatio>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </Section>
    );
  }

  if (error) {
    return (
      <Section variant="compact">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-xl text-destructive">QR Code Error</CardTitle>
            </div>
            <CardDescription>Failed to load QR code data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 space-y-4">
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Error Details:</p>
                <p className="text-destructive font-medium">{error}</p>
              </div>
              <Button 
                onClick={generateQRCode} 
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <QrCode className="h-4 w-4 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    );
  }

  if (!hasQRCode) {
    return (
      <Section variant="compact">
        <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Create QR Code</CardTitle>
            </div>
            <CardDescription>Share your book with a scannable QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 space-y-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <QrCode className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  Ready to generate your QR code?
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Create a QR code that links to your book for easy sharing and access. Perfect for presentations, handouts, or social media.
                </p>
              </div>
              <Button 
                onClick={generateQRCode} 
                disabled={isGenerating}
                size="lg"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <QrCode className="h-4 w-4 animate-pulse" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    );
  }

  return (
    <Section variant="compact">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">QR Code</CardTitle>
                <CardDescription className="text-sm">
                  {getStatusMessage(status, queuePosition)}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(status, queuePosition)}
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* QR Code Display */}
            <div className="flex justify-center">
              <div className="relative">
                <AspectRatio ratio={1} className="w-80">
                  {qrCodeImage ? (
                    <div className="relative group">
                      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-primary/10 transition-shadow group-hover:shadow-xl">
                        <img 
                          src={qrCodeImage} 
                          alt="QR Code for book sharing" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {/* Scannable area indicator */}
                      <div className="absolute -inset-2 border-2 border-dashed border-primary/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-muted rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                      <QrCode className="h-20 w-20 text-muted-foreground/50" />
                    </div>
                  )}
                </AspectRatio>
                
                {/* Status indicator overlay */}
                {status === 'active' && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Live
                  </div>
                )}
              </div>
            </div>

            {/* Public URL Section */}
            {publicUrl && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Public URL</label>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex-1 text-sm font-mono text-foreground break-all">
                      {publicUrl}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyUrl}
                        className="shrink-0 hover:bg-background"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(publicUrl, '_blank')}
                        className="shrink-0 hover:bg-background"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={downloadQRCode} 
                disabled={!qrCodeImage}
                size="lg"
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
              <Button 
                variant="outline" 
                onClick={generateQRCode}
                disabled={isGenerating}
                size="lg"
                className="sm:w-auto gap-2"
              >
                {isGenerating ? (
                  <>
                    <QrCode className="h-4 w-4 animate-pulse" />
                    Updating...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center py-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                QR codes work best when printed at least 2cm × 2cm in size for optimal scanning
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
};