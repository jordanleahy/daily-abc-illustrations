import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { generateEtsyListing } from '@/utils/marketing/generateEtsyListing';
import { supabase } from '@/integrations/supabase/client';
import { Check, Copy, Store, ExternalLink } from 'lucide-react';

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
    };
  };
  onPosted?: () => void;
}

export function EtsyPostDrawer({ open, onOpenChange, book, onPosted }: EtsyPostDrawerProps) {
  const { toast } = useToast();
  const [titleCopied, setTitleCopied] = useState(false);
  const [descriptionCopied, setDescriptionCopied] = useState(false);
  const [tagsCopied, setTagsCopied] = useState(false);
  const [isMarkingListed, setIsMarkingListed] = useState(false);

  const { title, description, tags } = generateEtsyListing({
    bookName: book.book_name,
    bookDescription: book.book_description,
    characterTheme: book.metadata?.characterTheme || null,
    bookType: book.metadata?.bookType || null,
    targetAge: book.metadata?.targetAge || null,
    pageCount: book.metadata?.pageCount || 12,
  });

  const handleCopy = async (text: string, type: 'title' | 'description' | 'tags') => {
    try {
      await copyToClipboard(text);
      
      if (type === 'title') {
        setTitleCopied(true);
        setTimeout(() => setTitleCopied(false), 2000);
      } else if (type === 'description') {
        setDescriptionCopied(true);
        setTimeout(() => setDescriptionCopied(false), 2000);
      } else {
        setTagsCopied(true);
        setTimeout(() => setTagsCopied(false), 2000);
      }
      
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} copied!` });
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

  const tagsText = tags.join(', ');

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

          {/* Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Tags <span className="text-muted-foreground font-normal">({tags.length}/13)</span>
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleCopy(tagsText, 'tags')}
              >
                {tagsCopied ? (
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
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-4">
          <Button
            onClick={handleMarkListed}
            disabled={isMarkingListed}
            className="w-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {isMarkingListed ? 'Saving...' : 'I\'ve Listed on Etsy'}
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
