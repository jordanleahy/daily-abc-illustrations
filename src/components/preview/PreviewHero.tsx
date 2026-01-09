import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Book } from 'lucide-react';
import { useLandingPageData } from '@/hooks/useLandingPageData';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useLazyCarouselImages } from '@/hooks/useLazyCarouselImages';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import heroVideo from '@/assets/hero-video.mov';

export const PreviewHero = () => {
  const { data: landingData } = useLandingPageData();
  const dailyPublished = landingData?.dailyPublished;
  const pages = dailyPublished?.pages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Lazy load carousel images on-demand
  useLazyCarouselImages(pages, currentPageIndex);
  
  const handlePrevPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const currentPage = pages[currentPageIndex];

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={heroVideo} type="video/quicktime" />
        <source src={heroVideo} type="video/mp4" />
      </video>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Title & Description */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
              Chairlift Habits
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed drop-shadow-md">
              Helping toddlers grow one habit at a time. One story. One moment. One habit each day.
            </p>
            <p className="text-sm text-white/80 drop-shadow">
              Simple setup. Cancel anytime. 30-day money-back guarantee.
            </p>
          </div>

          {/* Right Column - Daily Book Card */}
          <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-2xl p-6 border">
            {!dailyPublished ? (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="h-6 w-32 mx-auto bg-gradient-to-br from-muted via-muted/50 to-muted rounded" />
                  <div className="h-4 w-48 mx-auto bg-gradient-to-br from-muted via-muted/50 to-muted rounded" />
                </div>
                <AspectRatio ratio={1/1}>
                  <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted rounded-lg" />
                </AspectRatio>
                <div className="flex items-center justify-between gap-2">
                  <div className="h-16 flex-1 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-md" />
                  <div className="h-16 flex-1 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-md" />
                </div>
              </div>
            ) : dailyPublished && currentPage ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Daily Free Book
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Expires {dailyPublished.expires_at ? format(toZonedTime(new Date(dailyPublished.expires_at), 'America/New_York'), "MMM d 'at' h:mm a") + ' ET' : 'tomorrow at 7:01 AM ET'}
                  </p>
                </div>

                <AspectRatio ratio={1/1} className="bg-background rounded-lg overflow-hidden">
                  <OptimizedImage 
                    src={currentPage.image_url} 
                    alt={`${currentPage.letter} - ${currentPage.title}`} 
                    priority={currentPageIndex === 0} 
                    width={800} 
                    height={800}
                    srcSetSizes={[400, 600, 800, 1200]} 
                    sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, 400px" 
                    fallback={
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="h-12 w-12 text-muted-foreground" />
                      </div>
                    } 
                  />
                </AspectRatio>

                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1 h-16" 
                    onClick={handlePrevPage} 
                    disabled={currentPageIndex === 0}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>

                  <Button 
                    asChild
                    variant="default" 
                    className="flex-1 h-16"
                  >
                    <Link to={`/daily-published/${dailyPublished.id}`}>
                      <ChevronRight className="h-8 w-8" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <AspectRatio ratio={1/1} className="bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Loading today's book...</p>
              </AspectRatio>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
