import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/site';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Book } from 'lucide-react';
import { LandingDailyPublished } from '@/hooks/useLandingPageData';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useLazyCarouselImages } from '@/hooks/useLazyCarouselImages';
interface LandingHeroProps {
  dailyPublished: LandingDailyPublished | null | undefined;
}
export const LandingHero = ({
  dailyPublished
}: LandingHeroProps) => {
  const navigate = useNavigate();
  const pages = dailyPublished?.pages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Lazy load carousel images on-demand
  useLazyCarouselImages(pages, currentPageIndex);
  
  const handleNextPage = () => {
    if (dailyPublished) {
      window.open(`/daily-published/${dailyPublished.id}`, '_blank');
    }
  };
  
  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };
  const currentPage = pages[currentPageIndex];
  return <section className="w-full min-h-[600px] flex items-center py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Copy */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              {SITE_CONFIG.tagline}
            </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            {SITE_CONFIG.subheading}
          </p>
          </div>

          {/* Right Column - Daily Swiper */}
          <div className="relative bg-card rounded-lg shadow-xl p-6 border">
            {!dailyPublished ? <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="h-6 w-32 mx-auto bg-gradient-to-br from-muted via-muted/50 to-muted rounded" />
                  <div className="h-4 w-48 mx-auto bg-gradient-to-br from-muted via-muted/50 to-muted rounded" />
                </div>
                <AspectRatio ratio={1/1}>
                  <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted rounded-lg" />
                </AspectRatio>
                <div className="flex items-center justify-between gap-2">
                  <div className="h-10 w-10 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-md" />
                  <div className="h-12 w-16 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-md" />
                  <div className="h-10 w-10 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-md" />
                </div>
              </div> : dailyPublished && currentPage ? <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Today's Book
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Published at 7:01 AM Eastern Time
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
                    sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, (max-width: 1024px) 40vw, 600px" 
                    fallback={<div className="w-full h-full flex items-center justify-center">
                        <Book className="h-12 w-12 text-muted-foreground" />
                      </div>} 
                  />
                </AspectRatio>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-16" 
                    onClick={handlePrevPage} 
                    disabled={currentPageIndex === 0}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>

                  <Button 
                    variant="default" 
                    className="flex-1 h-16" 
                    onClick={handleNextPage}
                    title="Open full book"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </div>

              </div> : <AspectRatio ratio={1/1} className="bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Loading today's book...</p>
              </AspectRatio>}
          </div>
        </div>
      </div>
    </section>;
};