import { useState } from 'react';
import { Instagram } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCopyWithFeedback } from '@/hooks/useCopyWithFeedback';
import { generateGenericMarketingPost } from '@/utils/marketing/generateGenericMarketingPost';
import { SocialDrawerLayout } from './social-drawers/SocialDrawerLayout';
import { CopyableSection } from './social-drawers/CopyableSection';

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
  const { handleCopy, isCopied } = useCopyWithFeedback();
  const [isMarkingPosted, setIsMarkingPosted] = useState(false);

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

  const handleMarkPosted = async () => {
    setIsMarkingPosted(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) {
        throw new Error('Not authenticated');
      }

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

  return (
    <SocialDrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={`${platformName} Post`}
      description={`Copy the caption and hashtags for your ${platformName} post`}
      icon={Instagram}
      actionLabel={`I've Posted to ${platformName}`}
      isActionLoading={isMarkingPosted}
      onAction={handleMarkPosted}
    >
      <CopyableSection
        label="Caption"
        content={caption}
        isCopied={isCopied('caption')}
        onCopy={(e) => handleCopy(e, caption, 'caption')}
      />

      <CopyableSection
        label="Hashtags"
        content={hashtags}
        isCopied={isCopied('hashtags')}
        onCopy={(e) => handleCopy(e, hashtags, 'hashtags')}
        className="max-h-32"
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
