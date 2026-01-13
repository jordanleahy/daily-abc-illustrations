import { useParams, Link } from 'react-router-dom';
import { Mountain, Snowflake, BookOpen, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetaHead } from '@/components/common/MetaHead';
import { CategorizedBookSections } from '@/components/library/CategorizedBookSections';
import {
  useSkiResortBooks,
  formatResortName,
  getResortMetadata,
  getResortOgMetadata,
} from '@/hooks/useSkiResortBooks';

const SkiResortLanding = () => {
  const { resortId } = useParams<{ resortId: string }>();
  const { data: books, isLoading } = useSkiResortBooks(resortId);

  const displayName = resortId ? formatResortName(resortId) : 'Ski Resort';
  const resortMeta = resortId ? getResortMetadata(resortId) : null;
  const ogMeta = resortId ? getResortOgMetadata(resortId) : null;

  return (
    <>
      <MetaHead
        metadata={{
          title: ogMeta?.title || `${displayName} Children's Books`,
          description: ogMeta?.description || `Educational books for ${displayName}`,
          type: 'website',
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section with Gradient Background */}
        <section className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-background to-blue-600/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent" />

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 gap-2">
                <Mountain className="h-4 w-4" />
                {resortMeta?.emoji} {displayName}
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Learn While You Ski at{' '}
                <span className="text-primary">{displayName}</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {resortMeta?.description || 'Discover personalized children\'s books that bring learning to life on the mountain.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/pricing">
                    <Snowflake className="h-5 w-5" />
                    Get Free Access
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/library">
                    <BookOpen className="h-5 w-5" />
                    Browse Library
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Books Section */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {displayName} Book Collection
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Educational books featuring {displayName}'s iconic trails, lodges, and mountain adventures.
            </p>
          </div>

          {books && books.length > 0 ? (
            <CategorizedBookSections
              books={books}
              isLoading={isLoading}
              showAllCategories={false}
              maxBooksPerCategory={10}
              showViewAllLinks={false}
            />
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Mountain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  We're creating personalized books for {displayName}. Check back soon!
                </p>
                <Button asChild variant="outline">
                  <Link to="/library">Explore Other Books</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Value Proposition Section */}
        <section className="bg-muted/50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Learning on the Mountain
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Turn ski trips into educational adventures with personalized books featuring {displayName}.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Mountain-Themed Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    ABC books featuring ski lifts, snowflakes, and {displayName}'s famous trails.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Family Ski Memories</h3>
                  <p className="text-sm text-muted-foreground">
                    Create lasting memories with books that celebrate your family's ski adventures.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Après-Ski Reading</h3>
                  <p className="text-sm text-muted-foreground">
                    Wind down after a day on the slopes with educational bedtime stories.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <Snowflake className="h-10 w-10 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-4">
                Ready to Hit the Slopes?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Get free access to our library of personalized children's books and make your next ski trip educational and fun.
              </p>
              <Button asChild size="lg">
                <Link to="/pricing">Start Free Today</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

export default SkiResortLanding;
