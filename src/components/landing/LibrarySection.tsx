import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Library } from 'lucide-react';
import { Link } from 'react-router-dom';

const useAllPublishedBooks = () => {
  return useQuery({
    queryKey: ['all-published-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Book[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
};

export const LibrarySection = () => {
  const { data: books, isLoading } = useAllPublishedBooks();

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Library className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Complete Library</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our entire collection of educational ABC books
          </p>
          {books && (
            <p className="text-sm text-muted-foreground mt-2">
              {books.length} {books.length === 1 ? 'book' : 'books'} available
            </p>
          )}
        </div>

        {isLoading ? (
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
        ) : books && books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Link key={book.id} to={`/library/${book.id}`}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2 mb-1">
                          {book.book_name}
                        </CardTitle>
                        {book.category && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                            {book.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {book.book_description && (
                      <CardDescription className="line-clamp-3">
                        {book.book_description}
                      </CardDescription>
                    )}
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{book.total_pages || 26} pages</span>
                      <span className="text-primary font-medium hover:underline">
                        View Book →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No books available yet</p>
          </div>
        )}
      </div>
    </section>
  );
};
