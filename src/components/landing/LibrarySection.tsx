import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Library, Star, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LandingLibraryBook } from '@/hooks/useLandingPageData';
import { optimizeImageUrl, generateSrcSet } from '@/utils/imageOptimization';

interface LibrarySectionProps {
  books: LandingLibraryBook[] | undefined;
}

export const LibrarySection = ({ books }: LibrarySectionProps) => {
  const showSkeleton = !books || books.length === 0;
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Library className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Complete Library</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our complete daily published collection
          </p>
          {books && books.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {books.length} {books.length === 1 ? 'book' : 'books'} published
            </p>
          )}
        </div>

        {showSkeleton ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((item) => (
              <Link key={item.id} to={`/daily-published/${item.id}`}>
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2">
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    {item.og_image_url ? (
                      <img 
                        src={optimizeImageUrl(item.og_image_url, { width: 600 })}
                        srcSet={generateSrcSet(item.og_image_url, [600, 1200])}
                        sizes="(max-width: 768px) 100vw, 600px"
                        alt={item.title}
                        loading="lazy"
                        fetchPriority="low"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl font-bold text-primary/20">
                          {item.title.charAt(0)}
                        </div>
                      </div>
                    )}
                    {item.status === 'active' && item.is_active && (
                      <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                        Active Now
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl line-clamp-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.description && (
                      <CardDescription className="line-clamp-2 text-base mb-4">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
