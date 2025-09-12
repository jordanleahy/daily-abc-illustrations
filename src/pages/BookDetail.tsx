import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SystemPromptSection } from '@/components/book/SystemPromptSection';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProgressConsole, type ProgressMessage } from '@/components/ProgressConsole';
import { ProcessStatus } from '@/types/process';
import { BookWithPages } from '@/types/book';
import { ArrowLeft, Calendar, Users, Palette, ChevronDown, Loader2, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SafeLocalStorage, StyleGuideStorage, StyleGuideData } from '@/utils/storage';

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
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({});
  const [imagePromptLoading, setImagePromptLoading] = useState<Record<string, boolean>>({});
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  const [cachedStyleGuideInfo, setCachedStyleGuideInfo] = useState<{
    data: StyleGuideData;
    timeLeft: string;
  } | null>(null);

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

  // Check for cached style guide on mount and set up periodic updates
  useEffect(() => {
    if (!id) return;

    const checkCachedStyleGuide = () => {
      const cached = StyleGuideStorage.load(id);
      const expiration = StyleGuideStorage.getExpiration(id);
      
      if (cached && expiration) {
        // Set the style guide from cache
        setStyleGuide(cached.styleGuide);
        setShowStyleGuide(true);
        
        // Update cached info display
        setCachedStyleGuideInfo({
          data: cached,
          timeLeft: StyleGuideStorage.formatTimeLeft(expiration.timeLeft)
        });
      } else {
        setCachedStyleGuideInfo(null);
      }
    };

    // Check on mount
    checkCachedStyleGuide();

    // Update time left every 30 seconds
    const interval = setInterval(checkCachedStyleGuide, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const handleImageClick = async (pageId: string) => {
    if (!styleGuide) {
      toast.error('Please generate a style guide first');
      return;
    }

    if (imagePrompts[pageId]) {
      // If prompt already exists, copy to clipboard
      navigator.clipboard.writeText(imagePrompts[pageId]);
      toast.success('Image prompt copied to clipboard!');
      return;
    }

    setShimmeringPage(pageId);
    setImagePromptLoading(prev => ({ ...prev, [pageId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-image-prompt', {
        body: {
          pageId,
          userId: user?.id,
          styleGuide
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate image prompt');

      setImagePrompts(prev => ({ ...prev, [pageId]: data.imagePrompt }));
      toast.success('Image prompt generated! Click again to copy.');
    } catch (error: any) {
      console.error('Error generating image prompt:', error);
      toast.error('Failed to generate image prompt');
    } finally {
      setShimmeringPage(null);
      setImagePromptLoading(prev => ({ ...prev, [pageId]: false }));
    }
  };

  const handleBack = () => {
    navigate('/books');
  };

  const generateStyleGuide = async () => {
    if (!book || !user) return;
    
    setStyleGuideLoading(true);
    setProgressMessages([]);
    setIsProgressExpanded(true);

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

    // Clear previous messages and let backend handle all progress
    setProgressMessages([]);
    
    let receivedAnyEvents = false;
    
    try {
      const response = await fetch(
        `${baseUrl}/functions/v1/generate-style-guide?stream=true`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookId: book.id,
            userId: user.id,
            bookMetadata
          }),
        }
      );

      if (response.body) {
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
                receivedAnyEvents = true;
                setProgressMessages(prev => [...prev, data]);
  
                // Handle completion - check both status and step for completion
                if ((data.status === ProcessStatus.COMPLETE || data.step === 'complete') && data.styleGuide) {
                  setStyleGuide(data.styleGuide);
                  setShowStyleGuide(true);
                  
                  // Save to local storage for 48 hours
                  const styleGuideData: StyleGuideData = {
                    styleGuide: data.styleGuide,
                    bookId: id!,
                    agentUsed: data.agentUsed,
                    generatedAt: new Date().toISOString()
                  };
                  StyleGuideStorage.save(id!, styleGuideData);
                  
                  // Update cached info display
                  const expiration = StyleGuideStorage.getExpiration(id!);
                  if (expiration) {
                    setCachedStyleGuideInfo({
                      data: styleGuideData,
                      timeLeft: StyleGuideStorage.formatTimeLeft(expiration.timeLeft)
                    });
                  }
                  
                  toast.success('Style guide generated successfully!');
                }
                
                // Handle errors
                if (data.status === ProcessStatus.ERROR) {
                  toast.error(`Error: ${data.message}`);
                }
              } catch {
                // Ignore JSON parse errors for partial chunks
              }
            }
          }
        }
      }

      // Fallback: if we didn't receive any SSE event, call non-streaming function
      if (!receivedAnyEvents) {
        const { data, error } = await supabase.functions.invoke('generate-style-guide', {
          body: { bookId: book.id, userId: user.id, bookMetadata },
        });
        if (error) throw error;
        if (data?.styleGuide) {
          setStyleGuide(data.styleGuide);
          setShowStyleGuide(true);
          
          // Save to local storage for 48 hours
          const styleGuideData: StyleGuideData = {
            styleGuide: data.styleGuide,
            bookId: id!,
            agentUsed: data.agentUsed,
            generatedAt: new Date().toISOString()
          };
          StyleGuideStorage.save(id!, styleGuideData);
          
          // Update cached info display
          const expiration = StyleGuideStorage.getExpiration(id!);
          if (expiration) {
            setCachedStyleGuideInfo({
              data: styleGuideData,
              timeLeft: StyleGuideStorage.formatTimeLeft(expiration.timeLeft)
            });
          }
          
          toast.success('Style guide generated successfully!');
        } else {
          throw new Error('No style guide returned');
        }
      }
    } catch (error: any) {
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
                  {/* Cache Information */}
                  {cachedStyleGuideInfo && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Clock className="w-4 h-4" />
                          Cached Style Guide
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (id) {
                              StyleGuideStorage.remove(id);
                              setCachedStyleGuideInfo(null);
                              toast.success('Cache cleared');
                            }
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear Cache
                        </Button>
                      </div>
                      <div className="text-xs text-blue-600 space-y-1">
                        {cachedStyleGuideInfo.data.agentUsed && (
                          <div>
                            Agent: {cachedStyleGuideInfo.data.agentUsed.name} ({cachedStyleGuideInfo.data.agentUsed.model})
                          </div>
                        )}
                        <div>Generated: {new Date(cachedStyleGuideInfo.data.generatedAt).toLocaleString()}</div>
                        <div>Expires in: {cachedStyleGuideInfo.timeLeft}</div>
                      </div>
                    </div>
                  )}
                  
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

        {/* System Prompt Section */}
        <SystemPromptSection bookId={id!} />

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
                <CardContent className="p-4 space-y-3">
                  <Shimmer 
                    isShimmering={shimmeringPage === page.id}
                    className="w-full aspect-square bg-muted rounded-lg cursor-pointer hover:bg-muted/80 flex items-center justify-center"
                    onClick={() => handleImageClick(page.id)}
                  >
                    <div className="text-muted-foreground text-sm text-center">
                      {!styleGuide ? (
                        "Generate style guide first"
                      ) : imagePrompts[page.id] ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Palette className="w-3 h-3" />
                            Prompt ready
                          </div>
                          <div className="text-xs">Tap to copy prompt</div>
                        </div>
                      ) : imagePromptLoading[page.id] ? (
                        <div className="space-y-1">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          <div className="text-xs">Generating prompt...</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Palette className="w-3 h-3" />
                            Style guide ready
                          </div>
                          <div className="text-xs">Tap to generate prompt</div>
                        </div>
                      )}
                    </div>
                  </Shimmer>

                  {/* Show generated image prompt */}
                  {imagePrompts[page.id] && (
                    <div className="bg-muted rounded-lg p-3">
                      <h5 className="text-xs font-medium mb-1">Image Prompt:</h5>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {imagePrompts[page.id]}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}