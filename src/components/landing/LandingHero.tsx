import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/site';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Book } from 'lucide-react';
import { LandingDailyPublished } from '@/hooks/useLandingPageData';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Shimmer } from '@/components/ui/shimmer';
interface LandingHeroProps {
  dailyPublished: LandingDailyPublished | null | undefined;
}
export const LandingHero = ({
  dailyPublished
}: LandingHeroProps) => {
  const navigate = useNavigate();
  const pages = dailyPublished?.pages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
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
            
            <Button size="lg" className="text-lg px-8 py-6 w-full md:w-auto" onClick={() => navigate('/pricing')}>
              Subscribe
            </Button>
          </div>

          {/* Right Column - Daily Swiper */}
          <div className="relative bg-card rounded-lg shadow-xl p-6 border">
            {!dailyPublished ? <div className="space-y-4">
                <div className="text-center">
                  <Shimmer className="h-6 w-32 mx-auto mb-2" />
                  <Shimmer className="h-4 w-48 mx-auto" />
                </div>
                <Shimmer className="aspect-square rounded-lg" />
                <div className="flex items-center justify-between">
                  <Shimmer className="h-10 w-10 rounded-md" />
                  <Shimmer className="h-12 w-16" />
                  <Shimmer className="h-10 w-10 rounded-md" />
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

                <div className="relative aspect-square bg-background rounded-lg overflow-hidden">
                  <OptimizedImage src={currentPage.image_url} alt={`${currentPage.letter} - ${currentPage.title}`} priority={true} width={800} srcSetSizes={[600, 800, 1200]} sizes="(max-width: 768px) 100vw, 600px" fallback={<div className="w-full h-full flex items-center justify-center">
                        <Book className="h-12 w-12 text-muted-foreground" />
                      </div>} />
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPageIndex === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="text-center">
                    <p className="font-semibold text-lg">{currentPage.letter}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentPageIndex + 1} / {pages.length}
                    </p>
                  </div>

                  <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPageIndex === pages.length - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div> : <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Loading today's book...</p>
              </div>}
          </div>
        </div>
      </div>
    </section>;
};