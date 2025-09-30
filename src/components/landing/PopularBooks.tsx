import { useBooks } from '@/hooks/useBooks';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Book } from 'lucide-react';

export const PopularBooks = () => {
  const { books, loading } = useBooks();
  const navigate = useNavigate();
  
  // Get first 6 published books
  const popularBooks = books.filter(book => book.status === 'published').slice(0, 6);

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
            <Card 
              key={book.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/library/${book.id}`)}
            >
              <CardContent className="p-6">
                {book.firstPageImageUrl ? (
                  <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={book.firstPageImageUrl} 
                      alt={book.book_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <Book className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
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
          ))}
        </div>
      </div>
    </section>
  );
};
