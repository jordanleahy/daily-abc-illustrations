import { useParams, Link } from 'react-router-dom';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { useCityBooks, formatCityName } from '@/hooks/useCityBooks';
import { MetaHead } from '@/components/common/MetaHead';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Book, MapPin, Users, Sparkles, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CityLanding = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const { data: books = [], isLoading } = useCityBooks(cityName);
  
  const displayName = cityName ? formatCityName(cityName) : 'Your City';

  return (
    <>
      <MetaHead 
        metadata={{
          title: `${displayName} Children's Books | ${getSiteTitle()}`,
          description: `Discover educational children's books created specifically for ${displayName}. Local stories, local learning, local pride.`,
          siteName: SITE_CONFIG.name,
        }}
      />
      <PreviewPageLayout>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Local Education Initiative</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Shelly Knows{' '}
                <span className="text-primary">{displayName}</span>{' '}
                Best
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Which means she can educate {displayName}'s kids best. 
                Local stories. Local landmarks. Local pride.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/auth?mode=signup">Partner With Us</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="mailto:partnerships@chairlifthabits.com">Contact Government Relations</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition for Government */}
        <PreviewSection variant="feature">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
              Why Local Governments Choose Chairlift
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Civic Pride</h3>
                  <p className="text-muted-foreground">
                    Books featuring local landmarks, history, and heroes build community pride from the earliest ages.
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
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">AI-Powered Creation</h3>
                  <p className="text-muted-foreground">
                    Our AI creates custom books featuring your city's unique character and educational priorities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </PreviewSection>

        {/* City Books Section */}
        <PreviewSection variant="default">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {displayName} Book Collection
              </h2>
              <p className="text-lg text-muted-foreground">
                Educational books created specifically for {displayName} families
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <AspectRatio ratio={1}>
                      <Skeleton className="w-full h-full" />
                    </AspectRatio>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <AspectRatio ratio={1} className="bg-muted">
                      {book.coverImageUrl ? (
                        <OptimizedImage
                          src={book.coverImageUrl}
                          alt={book.book_name}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Book className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </AspectRatio>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                        {book.book_name}
                      </h3>
                      {book.category && (
                        <p className="text-sm text-muted-foreground">{book.category}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
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

        {/* CTA Section */}
        <PreviewSection variant="cta">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Bring Chairlift to {displayName}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Partner with us to give every family in your city access to personalized, 
              local educational content.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <a href="mailto:partnerships@chairlifthabits.com">
                  Contact Government Relations
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing-info">View Pricing</Link>
              </Button>
            </div>
          </div>
        </PreviewSection>
      </PreviewPageLayout>
    </>
  );
};

export default CityLanding;
