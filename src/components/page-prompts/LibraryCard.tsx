import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { FileText, Copy, Download } from 'lucide-react';
import { usePageSystemPrompt } from '@/hooks/usePageSystemPrompt';
import { PageImageSection } from '@/components/PageImageSection';
import { useToast } from '@/hooks/use-toast';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import type { Page } from '@/types/book';

interface LibraryCardProps {
  page: Page;
  bookId: string;
}

export function LibraryCard({ page, bookId }: LibraryCardProps) {
  const { currentPrompt } = usePageSystemPrompt(page.id);
  const { toast } = useToast();
  const { currentImage } = usePageImageUrls(page.id);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleCopyPrompt = async () => {
    if (!currentPrompt?.content) return;

    try {
      await navigator.clipboard.writeText(currentPrompt.content);
      toast({
        title: "Copied!",
        description: "System prompt copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async () => {
    if (!currentImage?.image_url) {
      toast({
        title: "No Image",
        description: "No image available to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(currentImage.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              {page.letter}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleDownloadImage}
              disabled={!currentImage?.image_url || currentImage?.generation_status !== 'complete'}
              title="Download page image as PNG"
              aria-label="Download page image as PNG"
            >
              <Download className="w-3 h-3" />
            </Button>
            {currentPrompt && (
              <Toggle
                size="sm"
                className="w-6 h-6"
                pressed={showPrompt}
                onPressedChange={setShowPrompt}
                title="Toggle between image and prompt view"
                aria-label="Toggle between image and prompt view"
              >
                <FileText className="w-3 h-3" />
              </Toggle>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentPrompt && (
              <Badge variant="secondary" className="text-xs">
                Version {currentPrompt.version_number}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page.page_number}
            </span>
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2">
          {page.title}
        </CardTitle>
        {page.description && (
          <CardDescription className="line-clamp-2">
            {page.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {showPrompt && currentPrompt ? (
          <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-sm font-medium text-foreground p-3 pb-2 border-b border-border/50">
              <span>System Prompt:</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={handleCopyPrompt}
                  title="Copy system prompt to clipboard"
                  aria-label="Copy system prompt to clipboard"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {currentPrompt.content}
              </div>
            </div>
          </div>
        ) : (
          <PageImageSection
            pageId={page.id}
            bookId={bookId}
            showUpload={false}
          />
        )}
      </CardContent>
    </Card>
  );
}