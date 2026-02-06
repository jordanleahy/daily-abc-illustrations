import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCopyWithFeedback } from '@/hooks/useCopyWithFeedback';
import { SocialDrawerLayout } from './social-drawers/SocialDrawerLayout';
import { CopyableSection } from './social-drawers/CopyableSection';

// TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface TikTokPostDrawerProps {
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
  onPosted?: () => void;
}

function getThemeEmoji(theme: string | null | undefined): string {
  if (!theme) return '📖';
  
  const emojiMap: Record<string, string> = {
    'paw-patrol': '🐕',
    'frozen': '❄️',
    'peppa-pig': '🐷',
    'bluey': '🐕‍🦺',
    'cocomelon': '🍉',
    'moana': '🌊',
    'mickey-mouse': '🐭',
    'mario': '🍄',
    'sesame-street': '🎭',
    'bear-stories': '🐻',
  };
  
  return emojiMap[theme] || '📖';
}

function generateTikTokCaption(
  bookName: string,
  bookDescription: string | null,
  metadata?: TikTokPostDrawerProps['metadata']
): { caption: string; hashtags: string } {
  const themeEmoji = getThemeEmoji(metadata?.characterTheme);
  
  let caption = `${themeEmoji} ${bookName}`;
  
  if (bookDescription) {
    const firstSentence = bookDescription.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 60) {
      caption += `\n\n${firstSentence}`;
    }
  }
  
  caption += '\n\n✨ Free coloring pages included!';
  caption += '\n📚 Link in bio';
  
  const hashtags = generateTikTokHashtags(metadata);
  
  return { caption, hashtags };
}

function generateTikTokHashtags(metadata?: TikTokPostDrawerProps['metadata']): string {
  const tags: string[] = [
    '#kidstiktok',
    '#momsoftiktok',
    '#coloringbook',
    '#kidsactivities',
  ];
  
  if (metadata?.bookType) {
    const typeTagMap: Record<string, string[]> = {
      'abc': ['#abclearning', '#alphabetforkids'],
      'numbers': ['#countingforkids', '#numbersforkids'],
      'sight-words': ['#sightwords', '#learningtoread'],
      'digraphs': ['#phonics', '#readingpractice'],
      'cvc': ['#cvcwords', '#phonicsforkids'],
    };
    tags.push(...(typeTagMap[metadata.bookType] || []));
  }
  
  if (metadata?.season) {
    const seasonTagMap: Record<string, string> = {
      'SPRING': '#springactivities',
      'SUMMER': '#summeractivities',
      'FALL': '#fallactivities',
      'WINTER': '#winteractivities',
    };
    const seasonTag = seasonTagMap[metadata.season.toUpperCase()];
    if (seasonTag) tags.push(seasonTag);
  }
  
  if (metadata?.environment) {
    const envTagMap: Record<string, string[]> = {
      'SNOWBOARD_RESORT': ['#snowboardtok', '#skiresort'],
      'SKI_RESORT': ['#skitok', '#skilife'],
      'BEACH': ['#beachlife', '#beachkids'],
    };
    tags.push(...(envTagMap[metadata.environment.toUpperCase()] || []));
  }
  
  tags.push('#foryou', '#fyp', '#forkids');
  
  return tags.slice(0, 15).join(' ');
}

export function TikTokPostDrawer({ 
  open, 
  onOpenChange, 
  bookId,
  bookName, 
  bookDescription,
  marketingUrl,
  metadata,
  onPosted,
}: TikTokPostDrawerProps) {
  const { toast } = useToast();
  const { handleCopy, isCopied } = useCopyWithFeedback();
  const [isMarkingPosted, setIsMarkingPosted] = useState(false);
  const [isOutstandPosting, setIsOutstandPosting] = useState(false);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);

  const { caption, hashtags } = generateTikTokCaption(bookName, bookDescription || null, metadata);
  const fullPost = `${caption}\n\n${hashtags}`;

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
          platform: 'tiktok',
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
        description: 'TikTok post recorded.',
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
          platform: 'tiktok',
          content: fullPost,
          mediaUrls: selectedMediaUrls,
        },
      });

      if (error) throw error;

      await markAsPosted('outstand');
      
      toast({ 
        title: 'Posted to TikTok!',
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
      title="TikTok Post"
      description="Copy the caption and hashtags for your TikTok video"
      icon={TikTokIcon}
      actionLabel="I've Posted to TikTok"
      isActionLoading={isMarkingPosted}
      onAction={handleMarkPosted}
      onOutstandPost={handleOutstandPost}
      isOutstandPosting={isOutstandPosting}
      outstandLabel="Post to TikTok"
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
