import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { Mountain, Snowflake, BookOpen, Users, Heart, Book, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MetaHead } from '@/components/common/MetaHead';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { CategorizedBookSections } from '@/components/library/CategorizedBookSections';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import {
  useSkiResortBooks,
  formatResortName,
  getResortMetadata,
  getResortOgMetadata,
} from '@/hooks/useSkiResortBooks';

// Placeholder video - reusing Jersey City video until resort-specific videos are available
import jerseyCityVideo from '@/assets/cities/jerseycity-hero.mp4';

// Resort video mapping (placeholder for now)
const resortVideos: Record<string, string> = {
  'killington': jerseyCityVideo, // Placeholder - replace with actual Killington video
};

const SkiResortLanding = () => {
  const { resortId } = useParams<{ resortId: string }>();
  const navigate = useNavigate();
  const { data: books = [], isLoading } = useSkiResortBooks(resortId);
  const videoRef = useRef<HTMLVideoElement>(null);

  const displayName = resortId ? formatResortName(resortId) : 'Ski Resort';
  const resortMeta = resortId ? getResortMetadata(resortId) : null;
  const ogMeta = resortId ? getResortOgMetadata(resortId) : null;
  const resortVideo = resortId ? resortVideos[resortId] : undefined;

  // Scroll to top when resortId changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [resortId]);

  // Force play on mount for mobile browsers
  useEffect(() => {
    const video = videoRef.current;
    if (video && resortVideo) {
      video.play().catch(() => {
        // Autoplay was prevented, that's okay
      });
    }
  }, [resortVideo]);

  return (
    <>
      <MetaHead
        metadata={{
          title: ogMeta?.title || `${displayName} Children's Books | ${getSiteTitle()}`,
          description: ogMeta?.description || `Educational books for ${displayName}`,
          siteName: SITE_CONFIG.name,
          url: `https://dailyabcillustrations.com/skiresort/${resortId}`,
          type: 'website',
        }}
      />

      <PreviewPageLayout>
        {/* Hero Section with Video Background */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden">
          {/* Video Background (when available) */}
          {resortVideo && (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                // @ts-ignore - webkit-playsinline for older iOS
                webkit-playsinline="true"
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={resortVideo} type="video/quicktime" />
                <source src={resortVideo} type="video/mp4" />
              </video>
              {/* Dark Overlay for video */}
              <div className="absolute inset-0 bg-black/60" />
            </>
          )}

          {/* Gradient Background (fallback when no video) */}
          {!resortVideo && (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-background to-blue-600/20" />
          )}

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${resortVideo ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                <Mountain className="h-4 w-4" />
                <span className="text-sm font-medium">{resortMeta?.emoji} {displayName}</span>
              </div>

              <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${resortVideo ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>
                Learn While You Ski at {displayName}
              </h1>

              <p className={`text-xl md:text-2xl mb-8 leading-relaxed ${resortVideo ? 'text-white/90 drop-shadow-md' : 'text-muted-foreground'}`}>
                {resortMeta?.description || 'Discover personalized children\'s books that bring learning to life on the mountain.'}
              </p>

              <Button 
                size="lg" 
                variant={resortVideo ? 'secondary' : 'default'}
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Get Free Access
              </Button>
            </div>
          </div>
        </section>

        {/* Books Section */}
        <PreviewSection variant="default">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {displayName} Book Collection
              </h2>
              <p className="text-lg text-muted-foreground">
                Educational books featuring {displayName}'s iconic trails, lodges, and mountain adventures.
              </p>
            </div>

            {books.length > 0 || isLoading ? (
              <CategorizedBookSections
                books={books}
                isLoading={isLoading}
                showViewAllLinks={false}
              />
            ) : (
              <Card className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Book className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Coming Soon to {displayName}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We're creating personalized books for {displayName}. Check back soon!
                </p>
                <Button asChild variant="outline">
                  <Link to="/library">Explore Other Books</Link>
                </Button>
              </Card>
            )}
          </div>
        </PreviewSection>

        {/* Value Proposition Section */}
        <PreviewSection variant="feature">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
              Learning on the Mountain
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Mountain-Themed Learning</h3>
                  <p className="text-muted-foreground">
                    ABC books featuring ski lifts, snowflakes, and {displayName}'s famous trails.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Family Ski Memories</h3>
                  <p className="text-muted-foreground">
                    Create lasting memories with books that celebrate your family's ski adventures.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Après-Ski Reading</h3>
                  <p className="text-muted-foreground">
                    Wind down after a day on the slopes with educational bedtime stories.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </PreviewSection>

        {/* CTA Section */}
        <PreviewSection variant="cta">
          <div className="max-w-3xl mx-auto text-center">
            <Snowflake className="h-12 w-12 mx-auto text-primary mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Hit the Slopes?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get free access to our library of personalized children's books and make your next ski trip educational and fun.
            </p>
            <Button size="lg" onClick={() => navigate('/pricing')}>
              Start Free Today
            </Button>
          </div>
        </PreviewSection>
      </PreviewPageLayout>
    </>
  );
};

export default SkiResortLanding;
