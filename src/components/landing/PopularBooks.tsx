import { usePublicHighlightedBooks } from '@/hooks/usePublicHighlightedBooks';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useNavigate } from 'react-router-dom';
import { Book, Star } from 'lucide-react';

function PopularBookCard({ book }: { book: any }) {
  const { data: seoMetadata } = useBookSeoMetadata(book.id);
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all relative ring-2 ring-primary shadow-md"
      onClick={() => navigate(`/library/${book.id}`)}
    >
      <CardContent className="p-6">
        <Badge className="absolute top-4 right-4 bg-primary z-10">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Featured
        </Badge>
        
        {/* Book Thumbnail */}
        <AspectRatio ratio={1200/630} className="bg-muted rounded-lg overflow-hidden mb-4">
          {seoMetadata?.og_image_url ? (
            <img
              src={seoMetadata.og_image_url}
              alt={book.book_name}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Book className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </AspectRatio>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {book.book_name}
        </h3>
        {book.book_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.book_description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export const PopularBooks = () => {
  const { data: popularBooks = [], isLoading: loading } = usePublicHighlightedBooks();

  if (loading) {
    return (
      <section className="w-full py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Popular ABC Adventures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Popular ABC Adventures
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularBooks.map((book) => (
            <PopularBookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  );
};
