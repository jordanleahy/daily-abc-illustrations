import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { SystemPromptSection } from '@/components/book/SystemPromptSection';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BookWithPages } from '@/types/book';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookWithPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [shimmeringPage, setShimmeringPage] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth loading to complete before checking user status
    if (authLoading) return;
    
    if (!user || !id) {
      navigate('/auth');
      return;
    }

    const fetchBook = async () => {
      try {
        // Fetch book with pages
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (bookError) {
          console.error('Error fetching book:', bookError);
          toast.error('Failed to load book');
          navigate('/books');
          return;
        }

        if (!bookData) {
          toast.error('Book not found');
          navigate('/books');
          return;
        }

        const { data: pagesData, error: pagesError } = await supabase
          .from('pages')
          .select('*')
          .eq('book_id', id)
          .order('page_number');

        if (pagesError) {
          console.error('Error fetching pages:', pagesError);
          toast.error('Failed to load book pages');
          return;
        }

        setBook({
          ...bookData,
          pages: (pagesData || []).map(page => ({
            ...page,
            content: page.content as {
              mainConcept: string;
              funFact: string;
              activity: string;
            }
          }))
        });
      } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred while loading the book');
        navigate('/books');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [user, id, navigate, authLoading]);

  const handleImageClick = (pageId: string) => {
    setShimmeringPage(pageId);
    // Stop shimmer after 2 seconds
    setTimeout(() => setShimmeringPage(null), 2000);
  };

  const handleBack = () => {
    navigate('/books');
  };
  if (authLoading || loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading book...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (!book) {
    return (
      <PageLayout>
        <Container>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Book not found</p>
            <Button onClick={handleBack} className="mt-4">
              Back to Books
            </Button>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Books
            </Button>
          </div>

          {/* Book Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{book.book_name}</CardTitle>
                  {book.book_description && (
                    <CardDescription className="text-base">
                      {book.book_description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={book.is_published ? "default" : "secondary"}>
                    {book.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {book.total_pages} pages
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created {new Date(book.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
        </Card>

        {/* System Prompt Section */}
        <SystemPromptSection bookId={id!} />

          {/* Pages Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {book.pages.map((page) => (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {page.letter}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Page {page.page_number}
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {page.title}
                  </CardTitle>
                  {page.description && (
                    <CardDescription className="line-clamp-2">
                      {page.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <Shimmer 
                    isShimmering={shimmeringPage === page.id}
                    className="w-full aspect-square bg-muted rounded-lg cursor-pointer hover:bg-muted/80 flex items-center justify-center"
                    onClick={() => handleImageClick(page.id)}
                  >
                    <div className="text-muted-foreground text-sm text-center">
                      Tap to generate image
                    </div>
                  </Shimmer>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}