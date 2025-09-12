import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Books() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching books:', error);
          toast.error('Failed to load books');
          return;
        }

        setBooks(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred while loading books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user, navigate]);

  const handleViewBook = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleCreateNewBook = () => {
    navigate('/');
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <PageLayout title="My Books">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading your books...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Books">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My ABC Books</h1>
            <p className="text-muted-foreground">
              Create and manage your personalized ABC learning books
            </p>
          </div>
          <Button onClick={handleCreateNewBook} className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Create New Book
          </Button>
        </div>

        {books.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a conversation with our AI to create your first ABC book!
              </p>
              <Button onClick={handleCreateNewBook}>
                Create Your First Book
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Card key={book.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-2">
                      {book.book_name}
                    </CardTitle>
                    <Badge variant={book.is_published ? "default" : "secondary"}>
                      {book.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  {book.category && (
                    <Badge variant="outline" className="w-fit">
                      {book.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {book.book_description && (
                    <CardDescription className="line-clamp-3">
                      {book.book_description}
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {book.total_pages} pages
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(book.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleViewBook(book.id)}
                    className="w-full"
                    variant="outline"
                  >
                    View Book
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}