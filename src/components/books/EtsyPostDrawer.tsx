import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { generateEtsyListing } from '@/utils/marketing/generateEtsyListing';
import { generateBookPDF, fetchBookColoringImages, generatePDF } from '@/services/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { Check, Copy, Store, ExternalLink, Download, Palette, FileText } from 'lucide-react';
import { SocialImageGallery } from './social-drawers/SocialImageGallery';

interface EtsyPostDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: {
    id: string;
    book_name: string;
    book_description: string | null;
    metadata?: {
      characterTheme?: string;
      bookType?: string;
      targetAge?: string;
      pageCount?: number;
      city?: string;
      resort?: string;
      season?: string;
      location?: string;
      environment?: string;
      clothingBrand?: string;
      gradeLevel?: string;
      mannerType?: string;
      mannersSetting?: string;
    };
  };
  onPosted?: () => void;
}

export function EtsyPostDrawer({ open, onOpenChange, book, onPosted }: EtsyPostDrawerProps) {
  const { toast } = useToast();
  const [titleCopied, setTitleCopied] = useState(false);
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const [fileNameCopied, setFileNameCopied] = useState(false);
  const [copiedTagIndex, setCopiedTagIndex] = useState<number | null>(null);
  const [isMarkingListed, setIsMarkingListed] = useState(false);
  const [isDownloadingColorPdf, setIsDownloadingColorPdf] = useState(false);
  const [isDownloadingColoringPdf, setIsDownloadingColoringPdf] = useState(false);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);

  const { title, description, tags, fileName } = generateEtsyListing({
    bookName: book.book_name,
    bookDescription: book.book_description,
    characterTheme: book.metadata?.characterTheme || null,
    bookType: book.metadata?.bookType || null,
    targetAge: book.metadata?.targetAge || null,
    pageCount: book.metadata?.pageCount || 12,
    city: book.metadata?.city || null,
    resort: book.metadata?.resort || null,
    season: book.metadata?.season || null,
    location: book.metadata?.location || null,
    environment: book.metadata?.environment || null,
    clothingBrand: book.metadata?.clothingBrand || null,
    gradeLevel: book.metadata?.gradeLevel || null,
    mannerType: book.metadata?.mannerType || null,
    mannersSetting: book.metadata?.mannersSetting || null,
  });

  const handleCopy = async (e: React.MouseEvent, text: string, type: 'title' | 'description' | 'fileName') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyToClipboard(text);
      
      if (type === 'title') {
        setTitleCopied(true);
        setTimeout(() => setTitleCopied(false), 2000);
      } else if (type === 'description') {
        setDescriptionCopied(true);
        setTimeout(() => setDescriptionCopied(false), 2000);
      } else if (type === 'fileName') {
        setFileNameCopied(true);
        setTimeout(() => setFileNameCopied(false), 2000);
      }
      
      toast({ title: `${type === 'fileName' ? 'File name' : type.charAt(0).toUpperCase() + type.slice(1)} copied!` });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleMarkListed = async () => {
    setIsMarkingListed(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('book_social_posts')
        .insert({
          book_id: book.id,
          user_id: session.session.user.id,
          platform: 'etsy',
          posted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ 
        title: 'Marked as listed!',
        description: 'Etsy listing recorded successfully.',
      });
      onPosted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to mark as listed:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsMarkingListed(false);
    }
  };

  const handleDownloadColorPdf = async () => {
    setIsDownloadingColorPdf(true);
    try {
      await generateBookPDF(book.id, `${book.book_name}-Color`);
      toast({ title: 'Color PDF downloaded successfully!' });
    } catch (error) {
      console.error('Failed to download color PDF:', error);
      toast({ title: 'Failed to download PDF', variant: 'destructive' });
    } finally {
      setIsDownloadingColorPdf(false);
    }
  };

  const handleDownloadColoringPdf = async () => {
    setIsDownloadingColoringPdf(true);
    try {
      const coloringPages = await fetchBookColoringImages(book.id);
      if (coloringPages.length === 0) {
        toast({ title: 'No coloring pages available', description: 'This book has no coloring book images.', variant: 'destructive' });
        return;
      }
      
      const pdfBytes = await generatePDF(coloringPages);
      
      // Create download using shared utility
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const filename = `${book.book_name.replace(/[^a-zA-Z0-9\s-]/g, '')}-Coloring-Book.pdf`;
      const { downloadBlob } = await import('@/services/pdfStorageService');
      downloadBlob(blob, filename);
      
      toast({ title: 'Coloring Book PDF downloaded successfully!' });
    } catch (error) {
      console.error('Failed to download coloring PDF:', error);
      toast({ title: 'Failed to download PDF', variant: 'destructive' });
    } finally {
      setIsDownloadingColoringPdf(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Etsy Listing
          </DrawerTitle>
          <DrawerDescription>
            Copy the title, description, and tags for your Etsy digital download listing
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto flex-1">
          {/* File Name Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">File Name</label>
              <span className="text-xs text-muted-foreground">{fileName.length + 4}/70 chars</span>
            </div>
            <div className="relative">
              <div className="p-3 pr-12 bg-muted rounded-lg text-sm font-mono break-all">
                {fileName}.pdf
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={(e) => handleCopy(e, `${fileName}.pdf`, 'fileName')}
              >
                {fileNameCopied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Rename your PDF to this before uploading to Etsy
            </p>
          </div>

          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Title</label>
              <span className="text-xs text-muted-foreground">{title.length}/140 chars</span>
            </div>
            <div className="relative">
              <div className="p-3 pr-12 bg-muted rounded-lg text-sm break-words">
                {title}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={(e) => handleCopy(e, title, 'title')}
              >
                {titleCopied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={(e) => handleCopy(e, description, 'description')}
              >
                {descriptionCopied ? (
                  <>
                    <Check className="h-3 w-3 text-primary" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
              {description}
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Tags <span className="text-muted-foreground font-normal">({tags.length}/13)</span>
              </label>
              <span className="text-xs text-muted-foreground">Tap a tag to copy</span>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-primary/20 active:scale-95 transition-all"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        await copyToClipboard(tag);
                        setCopiedTagIndex(index);
                        setTimeout(() => setCopiedTagIndex(null), 1500);
                        toast({ title: `Copied "${tag}"` });
                      } catch (error) {
                        toast({ title: 'Failed to copy', variant: 'destructive' });
                      }
                    }}
                  >
                    {copiedTagIndex === index ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {tag}
                      </span>
                    ) : (
                      tag
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Download Section */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium text-foreground">Download PDFs</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={(e) => { e.stopPropagation(); handleDownloadColorPdf(); }}
                disabled={isDownloadingColorPdf}
              >
                <Palette className="h-4 w-4" />
                {isDownloadingColorPdf ? 'Generating...' : 'Color PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={(e) => { e.stopPropagation(); handleDownloadColoringPdf(); }}
                disabled={isDownloadingColoringPdf}
              >
                <FileText className="h-4 w-4" />
                {isDownloadingColoringPdf ? 'Generating...' : 'Coloring Book PDF'}
              </Button>
            </div>
          </div>

          {/* Image Gallery */}
          <SocialImageGallery
            bookId={book.id}
            selectedUrls={selectedMediaUrls}
            onSelectionChange={setSelectedMediaUrls}
          />
        </div>

        <DrawerFooter className="pt-4">
          <Button
            onClick={(e) => { e.stopPropagation(); handleMarkListed(); }}
            disabled={isMarkingListed}
            className="w-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {isMarkingListed ? 'Saving...' : 'I\'ve Listed on Etsy'}
          </Button>
          <Button
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
            className="w-full"
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
