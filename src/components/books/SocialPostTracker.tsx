import { useState, useEffect } from 'react';
import { Instagram, Facebook, Linkedin, Check, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocialPostTracking, SocialPlatform } from '@/hooks/useSocialPostTracking';
import { useGenerateOGAssets } from '@/hooks/useGenerateOGAssets';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// TikTok icon (Lucide doesn't have one)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface SocialPostTrackerProps {
  bookId: string;
  bookName: string;
  bookDescription?: string | null;
  dailyPublishedId: string;
}

const PLATFORMS: { id: SocialPlatform; icon: React.ReactNode; label: string }[] = [
  { id: 'instagram', icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
  { id: 'facebook', icon: <Facebook className="h-4 w-4" />, label: 'Facebook' },
  { id: 'tiktok', icon: <TikTokIcon className="h-4 w-4" />, label: 'TikTok' },
  { id: 'linkedin', icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn' },
];

export function SocialPostTracker({ bookId, bookName, bookDescription, dailyPublishedId }: SocialPostTrackerProps) {
  const { postedPlatforms, markAsPosted, isMarking } = useSocialPostTracking(bookId);
  const { mutate: generateOGAssets, isPending: isGeneratingOG } = useGenerateOGAssets();
  
  // Check if OG assets already exist for this book
  const { data: hasOGAssets } = useQuery({
    queryKey: ['og-assets-exists', bookId],
    queryFn: async () => {
      const { data } = await supabase
        .from('seo_metadata')
        .select('id, og_image_url, seo_title')
        .eq('book_id', bookId)
        .eq('is_active', true)
        .maybeSingle();
      
      return !!(data?.og_image_url && data?.seo_title);
    },
  });
  
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // OG is "done" if assets exist in DB or we just generated them
  const ogComplete = hasOGAssets || showSuccessAnimation;

  const handlePlatformClick = (platform: SocialPlatform, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!postedPlatforms.includes(platform)) {
      markAsPosted(platform);
    }
  };

  const handleOGClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateOGAssets({
      bookId,
      title: bookName,
      description: bookDescription,
      dailyPublishedId
    }, {
      onSuccess: () => {
        setShowSuccessAnimation(true);
      }
    });
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* OG Assets button */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-8 w-8 relative transition-all",
          ogComplete 
            ? "bg-primary/10 border-primary text-primary hover:bg-primary/20" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={handleOGClick}
        disabled={isGeneratingOG || ogComplete}
        title={ogComplete ? "OG assets generated" : "Generate OG assets"}
      >
        <Image className={cn("h-4 w-4", isGeneratingOG && "animate-pulse")} />
        {ogComplete && (
          <Check className="h-3 w-3 absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5" />
        )}
      </Button>

      {/* Social platform buttons */}
      {PLATFORMS.map(({ id, icon, label }) => {
        const isPosted = postedPlatforms.includes(id);
        
        return (
          <Button
            key={id}
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 relative transition-all",
              isPosted 
                ? "bg-primary/10 border-primary text-primary hover:bg-primary/20" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(e) => handlePlatformClick(id, e)}
            disabled={isMarking || isPosted}
            title={isPosted ? `Posted to ${label}` : `Mark as posted to ${label}`}
          >
            {icon}
            {isPosted && (
              <Check className="h-3 w-3 absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
