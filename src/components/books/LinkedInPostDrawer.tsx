import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { generateLinkedInPost } from '@/utils/marketing/generateLinkedInPost';
import { supabase } from '@/integrations/supabase/client';
import { SITE_CONFIG } from '@/config/site';
import { Check, Copy, Linkedin, ExternalLink } from 'lucide-react';

interface LinkedInPostDrawerProps {
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
      location?: string;
      targetAge?: string;
    };
  };
  publicationSlug?: string | null;
  onPosted?: () => void;
}

export function LinkedInPostDrawer({ open, onOpenChange, book, publicationSlug, onPosted }: LinkedInPostDrawerProps) {
  const { toast } = useToast();
  const [postCopied, setPostCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [fullPostCopied, setFullPostCopied] = useState(false);
  const [isMarkingPosted, setIsMarkingPosted] = useState(false);

  const slug = publicationSlug || book.marketing_url;
  const marketingUrl = `${SITE_CONFIG.productionUrl}/book/${slug}`;

  const { post, hashtags, fullPost } = generateLinkedInPost({
    bookName: book.book_name,
    bookDescription: book.book_description,
    characterTheme: book.metadata?.characterTheme || null,
    marketingUrl,
    bookType: book.metadata?.bookType || null,
    season: book.metadata?.season || null,
    environment: book.metadata?.environment || null,
    location: book.metadata?.location || null,
    targetAge: book.metadata?.targetAge || null,
  });

  const handleCopy = async (text: string, type: 'post' | 'hashtags' | 'fullPost') => {
    try {
      await copyToClipboard(text);
      
      if (type === 'post') {
        setPostCopied(true);
        setTimeout(() => setPostCopied(false), 2000);
      } else if (type === 'hashtags') {
        setHashtagsCopied(true);
        setTimeout(() => setHashtagsCopied(false), 2000);
      } else {
        setFullPostCopied(true);
        setTimeout(() => setFullPostCopied(false), 2000);
      }
      
      const labels = { post: 'Post', hashtags: 'Hashtags', fullPost: 'Full post' };
      toast({ title: `${labels[type]} copied!` });
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

      // Record the LinkedIn post in book_social_posts table
      const { error } = await supabase
        .from('book_social_posts')
        .insert({
          book_id: book.id,
          user_id: session.session.user.id,
          platform: 'linkedin',
          posted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ 
        title: 'Marked as posted!',
        description: 'LinkedIn post recorded successfully.',
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            LinkedIn Post
          </DrawerTitle>
          <DrawerDescription>
            Copy the professional post content for LinkedIn
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto flex-1">
          {/* Post Content Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Post Content</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleCopy(post, 'post')}
              >
                {postCopied ? (
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
              {post}
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

          {/* Full Post Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Full Post</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleCopy(fullPost, 'fullPost')}
              >
                {fullPostCopied ? (
                  <>
                    <Check className="h-3 w-3 text-primary" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy All
                  </>
                )}
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
            {isMarkingPosted ? 'Saving...' : "I've Posted to LinkedIn"}
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
