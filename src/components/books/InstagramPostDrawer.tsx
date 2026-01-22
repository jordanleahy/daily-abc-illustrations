import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { generateGenericMarketingPost } from '@/utils/marketing/generateGenericMarketingPost';
import { generateDigraphMarketingPost } from '@/utils/marketing/generateDigraphMarketingPost';
import { supabase } from '@/integrations/supabase/client';
import { SITE_CONFIG } from '@/config/site';
import { Check, Copy, Instagram, ExternalLink } from 'lucide-react';

interface InstagramPostDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookName: string;
  bookDescription?: string | null;
  marketingUrl: string;
  metadata?: {
    characterTheme?: string;
    bookType?: string;
    season?: string;
    environment?: string;
    clothingBrand?: string;
    location?: string;
    targetAge?: string;
  };
  platform: 'instagram' | 'facebook';
  onPosted?: () => void;
}

export function InstagramPostDrawer({ 
  open, 
  onOpenChange, 
  bookId,
  bookName, 
  bookDescription,
  marketingUrl,
  metadata,
  platform,
  onPosted,
}: InstagramPostDrawerProps) {
  const { toast } = useToast();
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [isMarkingPosted, setIsMarkingPosted] = useState(false);

  // Generate the marketing post content
  const isDigraph = metadata?.bookType === 'digraphs';
  
  // For digraphs, we'd need page titles - for now use generic post format
  const fullPost = generateGenericMarketingPost({
    bookName,
    bookDescription: bookDescription || null,
    characterTheme: metadata?.characterTheme || null,
    marketingUrl,
    bookType: metadata?.bookType || null,
    season: metadata?.season || null,
    environment: metadata?.environment || null,
    clothingBrand: metadata?.clothingBrand || null,
    location: metadata?.location || null,
    targetAge: metadata?.targetAge || null,
  });

  // Split post into caption and hashtags
  const hashtagsMatch = fullPost.match(/(#\w+\s*)+$/);
  const hashtags = hashtagsMatch ? hashtagsMatch[0].trim() : '';
  const caption = hashtags ? fullPost.replace(hashtags, '').trim() : fullPost;

  const handleCopy = async (text: string, type: 'caption' | 'hashtags') => {
    try {
      await copyToClipboard(text);
      
      if (type === 'caption') {
        setCaptionCopied(true);
        setTimeout(() => setCaptionCopied(false), 2000);
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

  const handleMarkPosted = async () => {
    setIsMarkingPosted(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) {
        throw new Error('Not authenticated');
      }

      // Record the post in book_social_posts table
      const { error } = await supabase
        .from('book_social_posts')
        .insert({
          book_id: bookId,
          user_id: session.session.user.id,
          platform: platform,
          posted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ 
        title: 'Marked as posted!',
        description: `${platform === 'instagram' ? 'Instagram' : 'Facebook'} post recorded.`,
      });
      
      onPosted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to mark as posted:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsMarkingPosted(false);
    }
  };

  const platformName = platform === 'instagram' ? 'Instagram' : 'Facebook';
  const PlatformIcon = Instagram; // Use Instagram icon for both since they're similar formats

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <PlatformIcon className="h-5 w-5" />
            {platformName} Post
          </DrawerTitle>
          <DrawerDescription>
            Copy the caption and hashtags for your {platformName} post
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto flex-1">
          {/* Caption Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Caption</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleCopy(caption, 'caption')}
              >
                {captionCopied ? (
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
              {caption}
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
            <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
              {hashtags}
            </div>
          </div>

          {/* Full Post Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Full Post</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleCopy(fullPost, 'caption')}
              >
                <Copy className="h-3 w-3" />
                Copy All
              </Button>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap">
              {fullPost}
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-4">
          <Button
            onClick={handleMarkPosted}
            disabled={isMarkingPosted}
            className="w-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {isMarkingPosted ? 'Saving...' : `I've Posted to ${platformName}`}
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
