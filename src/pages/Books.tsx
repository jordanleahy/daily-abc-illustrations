import { useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useBooks } from '@/hooks/useBooks';
import { AdminOnly } from '@/components/AdminOnly';
import { BookOpen, Calendar, Users, Sparkles } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';

export default function Books() {
  const { user, loading: authLoading } = useAuth();
  const { books, loading } = useBooks();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [seoGenerating, setSeoGenerating] = useState(false);

  // Redirect to auth if not authenticated (but not if already on auth page)
  if (!authLoading && !user && location.pathname !== '/auth') {
    navigate('/auth');
    return null;
  }

  const handleViewBook = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleCreateNewBook = () => {
    navigate('/');
  };

  const handleGenerateSEOForAllBooks = async () => {
    try {
      setSeoGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-seo-for-all-books');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "SEO Generation Started",
        description: `Processing ${data.totalBooks} books. Check the Edge Function logs for progress.`,
      });
      
    } catch (error) {
      console.error('Error triggering SEO generation:', error);
      toast({
        title: "Error",
        description: "Failed to start SEO generation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSeoGenerating(false);
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <PageLayout title="My Books">
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <PageLayout title="My Books">
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading your books...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Books">
      <Container className="py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My ABC Books</h1>
              <p className="text-muted-foreground">
                Create and manage your personalized ABC learning books
              </p>
            </div>
            <div className="flex gap-2">
              <AdminOnly>
                <Button 
                  onClick={handleGenerateSEOForAllBooks}
                  disabled={seoGenerating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {seoGenerating ? 'Generating SEO...' : 'Generate SEO for All Books'}
                </Button>
              </AdminOnly>
              <Button onClick={handleCreateNewBook} className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Create New Book
              </Button>
            </div>
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
                <Card 
                  key={book.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg" 
                  onClick={() => handleViewBook(book.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-2">
                        {book.book_name}
                      </CardTitle>
                      <Badge variant={book.status === 'published' ? "default" : "secondary"}>
                        {book.status === 'published' ? 'Published' : book.status === 'draft' ? 'Draft' : 'Archived'}
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
                    
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {book.firstPageImageUrl ? (
                        <OptimizedImage 
                          src={book.firstPageImageUrl} 
                          alt={`Preview of ${book.book_name}`}
                          className="w-full h-full object-cover"
                          shimmerVariant="default"
                          critical={true}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  );
}