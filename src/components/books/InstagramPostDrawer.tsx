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
  const [isOutstandPosting, setIsOutstandPosting] = useState(false);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);

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

  const markAsPosted = async (postedVia: 'manual' | 'outstand' = 'manual') => {
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
        description: `${platform === 'instagram' ? 'Instagram' : 'Facebook'} post recorded.`,
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
    const requestBody = {
      platform: platform,
      content: fullPost,
      mediaUrls: selectedMediaUrls,
    };
    console.log(`[OutstandPost] 🚀 Starting ${platform} post`);
    console.log(`[OutstandPost] 📝 Content length: ${fullPost.length} chars`);
    console.log(`[OutstandPost] 🖼️ Media URLs selected: ${selectedMediaUrls.length}`, selectedMediaUrls);
    console.log(`[OutstandPost] 📦 Request body:`, JSON.stringify(requestBody, null, 2));
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('post-to-outstand', {
        body: requestBody,
      });
      const elapsed = Date.now() - startTime;

      console.log(`[OutstandPost] ⏱️ Response received in ${elapsed}ms`);
      console.log(`[OutstandPost] 📥 Response data:`, JSON.stringify(data, null, 2));
      
      if (error) {
        console.error(`[OutstandPost] ❌ Supabase function error:`, error);
        console.error(`[OutstandPost] ❌ Error type: ${typeof error}, message: ${error?.message || 'unknown'}`);
        throw error;
      }

      if (data?.error) {
        console.error(`[OutstandPost] ❌ API returned error in data:`, data.error);
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      console.log(`[OutstandPost] ✅ Success! Post ID: ${data?.postId}, Status: ${data?.status}`);
      await markAsPosted('outstand');
      
      toast({ 
        title: `Posted to ${platform === 'instagram' ? 'Instagram' : 'Facebook'}!`,
        description: `Post published via Outstand (ID: ${data?.postId || 'unknown'}).`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error(`[OutstandPost] ❌ FAILED to post to ${platform}:`, error);
      console.error(`[OutstandPost] ❌ Error details:`, {
        name: error instanceof Error ? error.name : 'unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast({ 
        title: 'Failed to post', 
        description: error instanceof Error ? error.message : 'Please try again or post manually.',
        variant: 'destructive' 
      });
    } finally {
      setIsOutstandPosting(false);
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
      onOutstandPost={handleOutstandPost}
      isOutstandPosting={isOutstandPosting}
      outstandLabel={`Post to ${platformName}`}
      bookId={bookId}
      selectedMediaUrls={selectedMediaUrls}
      onMediaSelectionChange={setSelectedMediaUrls}
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
