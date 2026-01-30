import { useState } from 'react';
import { Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCopyWithFeedback } from '@/hooks/useCopyWithFeedback';
import { generateYouTubePost } from '@/utils/marketing/generateYouTubePost';
import { SITE_CONFIG } from '@/config/site';
import { SocialDrawerLayout } from './social-drawers/SocialDrawerLayout';
import { CopyableSection } from './social-drawers/CopyableSection';

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
  const { handleCopy, isCopied } = useCopyWithFeedback();
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

  const handleMarkUploaded = async () => {
    setIsMarkingUploaded(true);
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
    <SocialDrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title="YouTube Post"
      description="Copy the title, description, and hashtags for your YouTube video"
      icon={Youtube}
      iconClassName="h-5 w-5 text-destructive"
      actionLabel="I've Uploaded to YouTube"
      isActionLoading={isMarkingUploaded}
      onAction={handleMarkUploaded}
    >
      <CopyableSection
        label="Title"
        content={title}
        isCopied={isCopied('title')}
        onCopy={(e) => handleCopy(e, title, 'title')}
        charCount={{ current: title.length, max: 100 }}
      />

      <CopyableSection
        label="Description"
        content={description}
        isCopied={isCopied('description')}
        onCopy={(e) => handleCopy(e, description, 'description')}
      />

      <CopyableSection
        label="Hashtags"
        content={hashtags}
        isCopied={isCopied('hashtags')}
        onCopy={(e) => handleCopy(e, hashtags, 'hashtags')}
      />
    </SocialDrawerLayout>
  );
}
