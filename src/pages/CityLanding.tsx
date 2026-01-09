import { useParams, Link } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { useCityBooks, formatCityName } from '@/hooks/useCityBooks';
import { MetaHead } from '@/components/common/MetaHead';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategorizedBookSections } from '@/components/library/CategorizedBookSections';
import { MapPin, Users, Sparkles, Building2, Book } from 'lucide-react';

// City-specific video imports
import jerseyCityVideo from '@/assets/cities/jerseycity-hero.mp4';

// City video mapping
const cityVideos: Record<string, string> = {
  'jerseycity': jerseyCityVideo,
};

const CityLanding = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const { data: books = [], isLoading } = useCityBooks(cityName);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const displayName = cityName ? formatCityName(cityName) : 'Your City';
  const cityVideo = cityName ? cityVideos[cityName] : undefined;

  // Force play on mount for mobile browsers
  useEffect(() => {
    const video = videoRef.current;
    if (video && cityVideo) {
      video.play().catch(() => {
        // Autoplay was prevented, that's okay
      });
    }
  }, [cityVideo]);

  // City-specific OG metadata (generated via generate-og-image edge function)
  const cityOgData: Record<string, { image: string; title: string; description: string }> = {
    'jerseycity': {
      image: 'https://foxdnspwzhjxjxuicute.supabase.co/storage/v1/object/public/page-images/og-images/city-jerseycity-1767971860984.png',
      title: 'A Better Approach to Jersey City Education',
      description: 'Truly personalized, on-demand, relevant-based. Targeted specifically for Jersey City neighborhoods and diversity.',
    },
  };

  const cityData = cityName ? cityOgData[cityName] : undefined;

  return (
    <>
      <MetaHead 
        metadata={{
          title: cityData?.title || `${displayName} Children's Books | ${getSiteTitle()}`,
          description: cityData?.description || `Discover educational children's books created specifically for ${displayName}. Local stories, local learning, local pride.`,
          siteName: SITE_CONFIG.name,
          url: `https://dailyabcillustrations.com/city/${cityName}`,
          image: cityData?.image ? {
            url: cityData.image,
            width: 1200,
            height: 630,
            alt: cityData.title || `${displayName} Children's Books`
          } : undefined,
        }}
      />
      <PreviewPageLayout>
        {/* Hero Section with Video Background */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden">
          {/* Video Background (when available) */}
          {cityVideo && (
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
                <source src={cityVideo} type="video/quicktime" />
                <source src={cityVideo} type="video/mp4" />
              </video>
              {/* Dark Overlay for video */}
              <div className="absolute inset-0 bg-black/60" />
            </>
          )}
          
          {/* Gradient Background (fallback when no video) */}
          {!cityVideo && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          )}

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${cityVideo ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Solomon Administration Education Initiative</span>
              </div>
              
              <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${cityVideo ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>
                Free Amazing Education in First 100 Days
              </h1>
              
              <p className={`text-xl md:text-2xl mb-8 leading-relaxed ${cityVideo ? 'text-white/90 drop-shadow-md' : 'text-muted-foreground'}`}>
                Focused on early phonics and positive habits creation, with daily published books.
              </p>

              <Button size="lg" asChild variant={cityVideo ? 'secondary' : 'default'}>
                <a href="mailto:jordanwilliamleahy@gmail.com">Contact</a>
              </Button>
            </div>
          </div>
        </section>

        {/* City Books Section */}
        <PreviewSection variant="default">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {displayName} Book Collection
              </h2>
              <p className="text-lg text-muted-foreground">
                Educational books created specifically for {displayName} families
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
                  We're working on creating custom educational books for {displayName}. 
                  Partner with us to bring Chairlift to your community.
                </p>
                <Button asChild>
                  <a href="mailto:partnerships@chairlifthabits.com">
                    Start a Partnership
                  </a>
                </Button>
              </Card>
            )}
          </div>
        </PreviewSection>

        {/* Value Proposition for Government */}
        <PreviewSection variant="feature">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
              What We Can Do Together
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Book className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Personalized Education</h3>
                  <p className="text-muted-foreground">
                    We can build age, neighborhood, and culturally relevant educational micro-learning experiences tailored to {displayName} families.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Family Engagement</h3>
                  <p className="text-muted-foreground">
                    Give every family in your city free access to educational content that keeps kids learning.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Improve {displayName} Schools</h3>
                  <p className="text-muted-foreground">
                    We leverage AI to create unique, personalized learning experiences that supplement school resources and extend into the family.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </PreviewSection>
        {/* CTA Section */}
        <PreviewSection variant="cta">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Would Work
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              I'm building educational books daily for my daughter to solve the challenges I have at home. I believe we can partner and explore how to expand to families at zero monetary cost to city or school.
            </p>
          </div>
        </PreviewSection>
      </PreviewPageLayout>
    </>
  );
};

export default CityLanding;
