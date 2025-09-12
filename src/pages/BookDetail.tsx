import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProgressConsole, type ProgressMessage } from '@/components/ProgressConsole';
import { ProcessStatus } from '@/types/process';
import { BookWithPages } from '@/types/book';
import { ArrowLeft, Calendar, Users, Palette, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookWithPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [shimmeringPage, setShimmeringPage] = useState<string | null>(null);
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [styleGuide, setStyleGuide] = useState<string | null>(null);
  const [showStyleGuide, setShowStyleGuide] = useState(false);

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

  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);

  const generateStyleGuide = async () => {
    if (!book || !user) return;
    
    setStyleGuideLoading(true);
    setProgressMessages([]);
    setIsProgressExpanded(true);
    
    try {
      const bookMetadata = {
        book_name: book.book_name,
        book_description: book.book_description,
        category: book.category,
        total_pages: book.total_pages,
        pages: book.pages.map(page => ({
          letter: page.letter,
          title: page.title,
          description: page.description,
          content: page.content
        }))
      };

      // Use SSE for streaming progress - construct URL from window location
      const baseUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:54321'
        : 'https://foxdnspwzhjxjxuicute.supabase.co';
      
      const response = await fetch(
        `${baseUrl}/functions/v1/generate-style-guide?stream=true`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookId: book.id,
            userId: user.id,
            bookMetadata
          }),
        }
      );

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgressMessages(prev => [...prev, data]);

              // Handle completion
              if (data.step === 'complete' && data.styleGuide) {
                setStyleGuide(data.styleGuide);
                setShowStyleGuide(true);
                toast.success('Style guide generated successfully!');
              }
              
              // Handle errors
              if (data.step === 'error') {
                toast.error(`Error: ${data.message}`);
              }
            } catch (e) {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while generating the style guide');
      setProgressMessages(prev => [...prev, {
        step: 'error',
        message: `Network error: ${error.message}`,
        timestamp: new Date().toISOString(),
        status: ProcessStatus.ERROR
      }]);
    } finally {
      setStyleGuideLoading(false);
    }
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
                  <Button
                    variant="outline"
                    onClick={generateStyleGuide}
                    disabled={styleGuideLoading}
                    className="flex items-center gap-2"
                  >
                    {styleGuideLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Palette className="w-4 h-4" />
                        Call Illustration Director
                      </>
                    )}
                  </Button>
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
            
            {/* Style Guide Section */}
            {styleGuide && (
              <CardContent className="pt-0">
                <Collapsible open={showStyleGuide} onOpenChange={setShowStyleGuide}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-0 h-auto font-medium">
                      <ChevronDown className={`w-4 h-4 transition-transform ${showStyleGuide ? 'rotate-180' : ''}`} />
                      Style Guide Generated
                      <Badge variant="secondary" className="ml-2">New</Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-2">Visual Style Guidelines</h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {styleGuide}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            )}
          </Card>

          {/* Progress Console */}
          {progressMessages.length > 0 && (
            <ProgressConsole
              messages={progressMessages}
              isExpanded={isProgressExpanded}
              onToggle={() => setIsProgressExpanded(!isProgressExpanded)}
              isActive={styleGuideLoading}
            />
          )}

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
                      {styleGuide ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Palette className="w-3 h-3" />
                            Style guide ready
                          </div>
                          <div className="text-xs">Tap to generate image</div>
                        </div>
                      ) : (
                        "Tap to generate image"
                      )}
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