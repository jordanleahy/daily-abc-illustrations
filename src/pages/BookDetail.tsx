import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';

import { useAuth } from '@/hooks/useAuth';
import { useBookPages } from '@/hooks/useBookPages';
import { supabase } from '@/integrations/supabase/client';
import { ProgressConsole, type ProgressMessage } from '@/components/ProgressConsole';
import { ProcessStatus } from '@/types/process';
import { Book } from '@/types/book';
import { ArrowLeft, Calendar, Users, Palette, Loader2, Edit3, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { SystemPromptSection } from '@/components/book';
import { PageSystemPromptSection } from '@/components/page-prompts';
import { useSystemPrompt } from '@/hooks/useSystemPrompt';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { currentPrompt, refreshData } = useSystemPrompt(id || '');
  const { pages } = useBookPages(id);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [shimmeringPage, setShimmeringPage] = useState<string | null>(null);
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({});
  const [imagePromptLoading, setImagePromptLoading] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [imageGenerationLoading, setImageGenerationLoading] = useState<Record<string, boolean>>({});
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  const [expandedPagePrompts, setExpandedPagePrompts] = useState<Record<string, boolean>>({});

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

        setBook(bookData);
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


  const handleImageClick = async (pageId: string) => {
    // Get style guide from current deployed system prompt
    if (!currentPrompt?.isDeployed || !currentPrompt?.content) {
      toast.error('Please generate and deploy a style guide first');
      return;
    }
    
    const styleGuide = currentPrompt.content;

    // If image already exists, show it in a modal or something (for now just show success)
    if (generatedImages[pageId]) {
      toast.success('Image already generated!');
      return;
    }

    // If prompt exists, generate image
    if (imagePrompts[pageId]) {
      setImageGenerationLoading(prev => ({ ...prev, [pageId]: true }));
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: {
            prompt: imagePrompts[pageId],
            pageId,
            userId: user?.id
          }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Failed to generate image');
        
        if (!data.imageData) {
          throw new Error('No image data returned');
        }

        // Store the generated image (base64 data)
        setGeneratedImages(prev => ({ ...prev, [pageId]: data.imageData }));
        toast.success('Image generated successfully!');
      } catch (error: any) {
        console.error('Error generating image:', error);
        toast.error('Failed to generate image');
      } finally {
        setImageGenerationLoading(prev => ({ ...prev, [pageId]: false }));
      }
      return;
    }

    // Generate prompt if none exists
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
      
      // Check if imagePrompt is empty or invalid
      if (!data.imagePrompt || data.imagePrompt.trim().length === 0) {
        throw new Error('Failed to generate image prompt - empty response');
      }

      setImagePrompts(prev => ({ ...prev, [pageId]: data.imagePrompt }));
      toast.success('Image prompt generated! Click again to generate image.');
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

  const togglePagePrompt = (pageId: string) => {
    setExpandedPagePrompts(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
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
      pages: pages.map(page => ({
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
                
                // Update existing message for same step or add new one
                setProgressMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.step === data.step);
                  if (existingIndex >= 0) {
                    // Update existing message for this step
                    const updated = [...prev];
                    updated[existingIndex] = data;
                    return updated;
                  } else {
                    // Add new message
                    return [...prev, data];
                  }
                });
  
                // Handle completion - check both status and step for completion
                if ((data.status === ProcessStatus.COMPLETE || data.step === 'complete') && data.styleGuide) {
                  // Stop the loading state when generation completes
                  setStyleGuideLoading(false);
                  
                  // Real-time subscription will automatically update the UI
                  console.log('Style guide generation completed, real-time subscription will update UI');
                  
                  toast.success('Style guide generated successfully!');
                }
                
                // Handle errors  
                if (data.status === ProcessStatus.ERROR) {
                  toast.error(`Error: ${data.message}`);
                  // Also stop loading on error
                  setStyleGuideLoading(false);
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
          // Real-time subscription will automatically update the UI
          console.log('Style guide generation completed via fallback, real-time subscription will update UI');
          
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
            
        </Card>


          {/* System Prompt Section */}
          <SystemPromptSection bookId={book.id} />

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
            {pages.map((page) => (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {page.letter}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePagePrompt(page.id)}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        {expandedPagePrompts[page.id] ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page.page_number}
                      </span>
                    </div>
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
                  {/* Page Prompt Management - Expandable */}
                  {expandedPagePrompts[page.id] && (
                    <div className="border-t pt-4">
                      <PageSystemPromptSection 
                        pageId={page.id} 
                        pageTitle={page.title}
                      />
                    </div>
                  )}
                  
                  <Shimmer 
                    isShimmering={shimmeringPage === page.id}
                    className="w-full aspect-square bg-muted rounded-lg cursor-pointer hover:bg-muted/80 flex items-center justify-center overflow-hidden"
                    onClick={() => handleImageClick(page.id)}
                  >
                    {generatedImages[page.id] ? (
                      // Show generated image
                      <img 
                        src={generatedImages[page.id]} 
                        alt={`Generated image for ${page.title}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm text-center">
                        {!currentPrompt?.isDeployed ? (
                          "Generate and deploy style guide first"
                        ) : imagePrompts[page.id] ? (
                          // Prompt exists, ready to generate image
                          imageGenerationLoading[page.id] ? (
                            <div className="space-y-2">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                              <div className="text-xs">Generating image...</div>
                            </div>
                          ) : (
                            <div className="space-y-2 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <Palette className="w-4 h-4" />
                                <span className="text-sm font-medium">Ready to Generate</span>
                              </div>
                              <div className="text-xs leading-relaxed max-h-16 overflow-y-auto opacity-70">
                                {imagePrompts[page.id].substring(0, 100)}...
                              </div>
                              <div className="text-xs font-medium text-primary">Tap to generate image</div>
                            </div>
                          )
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
                    )}
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