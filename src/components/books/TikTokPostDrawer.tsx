import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Check, Copy, ExternalLink } from 'lucide-react';

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

/**
 * Generate TikTok-optimized caption (shorter, more punchy)
 */
function generateTikTokCaption(
  bookName: string,
  bookDescription: string | null,
  metadata?: TikTokPostDrawerProps['metadata']
): { caption: string; hashtags: string } {
  // TikTok prefers shorter, punchier captions
  const themeEmoji = getThemeEmoji(metadata?.characterTheme);
  
  let caption = `${themeEmoji} ${bookName}`;
  
  if (bookDescription) {
    // Take first sentence only for TikTok
    const firstSentence = bookDescription.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 60) {
      caption += `\n\n${firstSentence}`;
    }
  }
  
  caption += '\n\n✨ Free coloring pages included!';
  caption += '\n📚 Link in bio';
  
  // TikTok hashtags - fewer but more targeted
  const hashtags = generateTikTokHashtags(metadata);
  
  return { caption, hashtags };
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

function generateTikTokHashtags(metadata?: TikTokPostDrawerProps['metadata']): string {
  const tags: string[] = [
    '#kidstiktok',
    '#momsoftiktok',
    '#coloringbook',
    '#kidsactivities',
  ];
  
  // Add book type specific tags
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
  
  // Add seasonal tags
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
  
  // Add environment/activity tags
  if (metadata?.environment) {
    const envTagMap: Record<string, string[]> = {
      'SNOWBOARD_RESORT': ['#snowboardtok', '#skiresort'],
      'SKI_RESORT': ['#skitok', '#skilife'],
      'BEACH': ['#beachlife', '#beachkids'],
    };
    tags.push(...(envTagMap[metadata.environment.toUpperCase()] || []));
  }
  
  // Core TikTok viral tags
  tags.push('#foryou', '#fyp', '#forkids');
  
  // Limit to ~15 hashtags for TikTok
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
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [isMarkingPosted, setIsMarkingPosted] = useState(false);

  const { caption, hashtags } = generateTikTokCaption(bookName, bookDescription || null, metadata);
  const fullPost = `${caption}\n\n${hashtags}`;

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

      const { error } = await supabase
        .from('book_social_posts')
        .insert({
          book_id: bookId,
          user_id: session.session.user.id,
          platform: 'tiktok',
          posted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ 
        title: 'Marked as posted!',
        description: 'TikTok post recorded.',
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
            <TikTokIcon className="h-5 w-5" />
            TikTok Post
          </DrawerTitle>
          <DrawerDescription>
            Copy the caption and hashtags for your TikTok video
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
            {isMarkingPosted ? 'Saving...' : "I've Posted to TikTok"}
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
