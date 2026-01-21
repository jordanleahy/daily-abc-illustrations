import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { generateYouTubePost } from '@/utils/marketing/generateYouTubePost';
import { supabase } from '@/integrations/supabase/client';
import { SITE_CONFIG } from '@/config/site';
import { Check, Copy, Youtube, ExternalLink } from 'lucide-react';

interface YouTubePostDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: {
    id: string;
    book_name: string;
    book_description: string | null;
    marketing_url: string | null;
    metadata?: {
      characterTheme?: string;
      bookType?: string;
      season?: string;
      environment?: string;
      clothingBrand?: string;
      location?: string;
      targetAge?: string;
    };
  };
  publicationSlug?: string | null;
}

export function YouTubePostDrawer({ open, onOpenChange, book, publicationSlug }: YouTubePostDrawerProps) {
  const { toast } = useToast();
  const [titleCopied, setTitleCopied] = useState(false);
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [isMarkingUploaded, setIsMarkingUploaded] = useState(false);

  const slug = publicationSlug || book.marketing_url;
  const marketingUrl = `${SITE_CONFIG.productionUrl}/book/${slug}`;

  const { title, description, hashtags } = generateYouTubePost({
    bookName: book.book_name,
    bookDescription: book.book_description,
    characterTheme: book.metadata?.characterTheme || null,
    marketingUrl,
    bookType: book.metadata?.bookType || null,
    season: book.metadata?.season || null,
    environment: book.metadata?.environment || null,
    clothingBrand: book.metadata?.clothingBrand || null,
    location: book.metadata?.location || null,
    targetAge: book.metadata?.targetAge || null,
  });

  const handleCopy = async (text: string, type: 'title' | 'description' | 'hashtags') => {
    try {
      await copyToClipboard(text);
      
      if (type === 'title') {
        setTitleCopied(true);
        setTimeout(() => setTitleCopied(false), 2000);
      } else if (type === 'description') {
        setDescriptionCopied(true);
        setTimeout(() => setDescriptionCopied(false), 2000);
      } else {
        setHashtagsCopied(true);
        setTimeout(() => setHashtagsCopied(false), 2000);
      }
      
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} copied!` });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleMarkUploaded = async () => {
    setIsMarkingUploaded(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) {
        throw new Error('Not authenticated');
      }

      // Record the YouTube post in book_social_posts table
      const { error } = await supabase
        .from('book_social_posts')
        .insert({
          book_id: book.id,
          user_id: session.session.user.id,
          platform: 'youtube',
          posted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ 
        title: 'Marked as uploaded!',
        description: 'YouTube post recorded successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to mark as uploaded:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsMarkingUploaded(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-destructive" />
            YouTube Post
          </DrawerTitle>
          <DrawerDescription>
            Copy the title, description, and hashtags for your YouTube video
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto flex-1">
          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Title</label>
              <span className="text-xs text-muted-foreground">{title.length}/100 chars</span>
            </div>
            <div className="relative">
              <div className="p-3 pr-12 bg-muted rounded-lg text-sm break-words">
                {title}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => handleCopy(title, 'title')}
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
                onClick={() => handleCopy(description, 'description')}
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

          {/* Hashtags Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Hashtags</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleCopy(hashtags, 'hashtags')}
              >
                {hashtagsCopied ? (
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
            <div className="p-3 bg-muted rounded-lg text-sm">
              {hashtags}
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-4">
          <Button
            onClick={handleMarkUploaded}
            disabled={isMarkingUploaded}
            className="w-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {isMarkingUploaded ? 'Saving...' : 'I\'ve Uploaded to YouTube'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
