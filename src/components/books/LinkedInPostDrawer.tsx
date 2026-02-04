import { useState } from 'react';
import { Linkedin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCopyWithFeedback } from '@/hooks/useCopyWithFeedback';
import { generateLinkedInPost } from '@/utils/marketing/generateLinkedInPost';
import { SITE_CONFIG } from '@/config/site';
import { SocialDrawerLayout } from './social-drawers/SocialDrawerLayout';
import { CopyableSection } from './social-drawers/CopyableSection';

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
  const { handleCopy, isCopied } = useCopyWithFeedback();
  const [isMarkingPosted, setIsMarkingPosted] = useState(false);
  const [isOutstandPosting, setIsOutstandPosting] = useState(false);

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

  const markAsPosted = async (postedVia: 'manual' | 'outstand' = 'manual') => {
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
          platform: 'linkedin',
          posted_at: new Date().toISOString(),
        });

      if (error) throw error;
      onPosted?.();
    } catch (error) {
      console.error('Failed to record post:', error);
    }
  };

  const handleMarkPosted = async () => {
    setIsMarkingPosted(true);
    try {
      await markAsPosted('manual');
      toast({ 
        title: 'Marked as posted!',
        description: 'LinkedIn post recorded successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to mark as posted:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsMarkingPosted(false);
    }
  };

  const handleOutstandPost = async () => {
    setIsOutstandPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-to-outstand', {
        body: {
          platform: 'linkedin',
          content: fullPost,
        },
      });

      if (error) throw error;

      await markAsPosted('outstand');
      
      toast({ 
        title: 'Posted to LinkedIn!',
        description: 'Your post has been published via Outstand.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to post via Outstand:', error);
      toast({ 
        title: 'Failed to post', 
        description: error instanceof Error ? error.message : 'Please try again or post manually.',
        variant: 'destructive' 
      });
    } finally {
      setIsOutstandPosting(false);
    }
  };

  return (
    <SocialDrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title="LinkedIn Post"
      description="Copy the professional post content for LinkedIn"
      icon={Linkedin}
      iconClassName="h-5 w-5 text-[#0A66C2]"
      actionLabel="I've Posted to LinkedIn"
      isActionLoading={isMarkingPosted}
      onAction={handleMarkPosted}
      onOutstandPost={handleOutstandPost}
      isOutstandPosting={isOutstandPosting}
      outstandLabel="Post to LinkedIn"
    >
      <CopyableSection
        label="Post Content"
        content={post}
        isCopied={isCopied('post')}
        onCopy={(e) => handleCopy(e, post, 'post', 'Post')}
      />

      <CopyableSection
        label="Hashtags"
        content={hashtags}
        isCopied={isCopied('hashtags')}
        onCopy={(e) => handleCopy(e, hashtags, 'hashtags')}
      />

      <CopyableSection
        label="Full Post"
        content={fullPost}
        isCopied={isCopied('fullPost')}
        onCopy={(e) => handleCopy(e, fullPost, 'fullPost', 'Full post')}
        variant="muted"
      />
    </SocialDrawerLayout>
  );
}
