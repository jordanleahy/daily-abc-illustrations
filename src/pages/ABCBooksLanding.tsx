import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { BookOpen, Sparkles, Star, Users, Heart, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MetaHead } from '@/components/common/MetaHead';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { CategorizedBookSections } from '@/components/library/CategorizedBookSections';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { useABCBooks, getABCThemeDisplayName, isValidABCTheme } from '@/hooks/useABCBooks';

// Placeholder video - reusing Jersey City video until theme-specific videos are available
import jerseyCityVideo from '@/assets/cities/jerseycity-hero.mp4';

const ABCBooksLanding = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: books = [], isLoading } = useABCBooks({ themeSlug: name });

  const displayName = name ? getABCThemeDisplayName(name) : 'ABC';
  const isValid = name ? isValidABCTheme(name) : true; // Valid when no name (shows all)

  // Force play on mount for mobile browsers
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay was prevented, that's okay
      });
    }
  }, []);

  // Invalid theme - show not found state
  if (!isValid && name) {
    return (
      <>
        <MetaHead
          metadata={{
            title: `ABC Books | ${getSiteTitle()}`,
            description: 'Explore our collection of ABC books for children.',
            siteName: SITE_CONFIG.name,
            url: `https://dailyabcillustrations.com/abc-books/${name}`,
            type: 'website',
          }}
        />
        <PreviewPageLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Theme Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find an ABC book collection for "{name}".
            </p>
            <Button asChild>
              <Link to="/library">Browse Library</Link>
            </Button>
          </div>
        </PreviewPageLayout>
      </>
    );
  }

  return (
    <>
      <MetaHead
        metadata={{
          title: `${displayName} ABC Books | ${getSiteTitle()}`,
          description: `Explore our collection of ${displayName.toLowerCase()}-themed ABC books for children. Beautiful illustrations and educational content.`,
          siteName: SITE_CONFIG.name,
          url: `https://dailyabcillustrations.com/abc-books/${name}`,
          type: 'website',
        }}
      />

      <PreviewPageLayout>
        {/* Hero Section with Video Background */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden">
          {/* Video Background */}
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
            <source src={jerseyCityVideo} type="video/quicktime" />
            <source src={jerseyCityVideo} type="video/mp4" />
          </video>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-white/20 text-white">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">ABC Book Collection</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
                {displayName} ABC Books
              </h1>

              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90 drop-shadow-md">
                Discover the alphabet through beautiful {displayName.toLowerCase()}-themed illustrations
              </p>

              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2"
              >
                <Star className="h-5 w-5" />
                Start Learning Today
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
                Browse our {displayName.toLowerCase()}-themed ABC book collection
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
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We're creating {displayName.toLowerCase()}-themed ABC books. Check back soon!
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
              Why {displayName} ABC Books?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Themed Learning</h3>
                  <p className="text-muted-foreground">
                    Each letter features beautiful {displayName.toLowerCase()}-themed illustrations.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Family Reading</h3>
                  <p className="text-muted-foreground">
                    Create lasting memories with books that match your child's interests.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Educational Fun</h3>
                  <p className="text-muted-foreground">
                    Learn the alphabet while exploring {displayName.toLowerCase()}.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </PreviewSection>

        {/* CTA Section */}
        <PreviewSection variant="cta">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get free access to our library of {displayName.toLowerCase()}-themed ABC books and more.
            </p>
            <Button size="lg" onClick={() => navigate('/pricing')}>
              Get Started Free
            </Button>
          </div>
        </PreviewSection>
      </PreviewPageLayout>
    </>
  );
};

export default ABCBooksLanding;
