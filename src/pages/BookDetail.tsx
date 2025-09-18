import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useAuth } from '@/hooks/useAuth';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useHasRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ProgressConsole, type ProgressMessage } from '@/components/ProgressConsole';
import { ProcessStatus } from '@/types/process';
import { ArrowLeft, Archive, Calendar, Users, Palette, Loader2, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { useSystemPrompt } from "@/hooks/useSystemPrompt";
import { SystemPromptSection } from "@/components/book";
import { ExportsSection } from '@/components/exports/ExportsSection';

import { PageImageSection } from "@/components/PageImageSection";
import { PageCard, UserPageCard, FocusedPageView } from '@/components/page-prompts';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPrompt, refreshData } = useSystemPrompt(id || '');
  const { pages } = useBookPages(id);
  const { data: book, isLoading: bookLoading, error: bookError, isFetched: bookFetched } = useBook(id);
  const isAdmin = useHasRole('admin');
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  const [isClassView, setIsClassView] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  

  useEffect(() => {
    // Wait for auth loading to complete before checking user status
    if (authLoading) return;
    
    if ((!user || !id) && location.pathname !== '/auth') {
      navigate('/auth');
      return;
    }
  }, [user, id, navigate, authLoading, location.pathname]);

  // Handle book not found only after auth and query have both completed
  useEffect(() => {
    if (!authLoading && user && id && bookFetched && !book) {
      toast.error('Book not found');
      navigate('/books');
    }
  }, [authLoading, user, id, bookFetched, book, navigate]);



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
                  
                  // Force refresh the system prompt data
                  await refreshData();
                  console.log('Style guide generation completed, forcing cache refresh');
                  
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
          // Force refresh the system prompt data
          await refreshData();
          console.log('Style guide generation completed via fallback, forcing cache refresh');
          
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

  const handleArchiveBook = async () => {
    if (!book || !user) return;
    
    setArchiveLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .update({ status: 'archived' })
        .eq('id', book.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error archiving book:', error);
        toast.error('Failed to archive book');
        return;
      }

      toast.success('Book archived successfully');
      navigate('/books');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('An error occurred while archiving the book');
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!book || !user) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting book:', error);
        toast.error('Failed to delete book');
        return;
      }

      toast.success('Book deleted successfully');
      navigate('/books');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('An error occurred while deleting the book');
    } finally {
      setDeleteLoading(false);
    }
  };
  if (authLoading || (user && !bookFetched)) {
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

  // Render focused view without header when in class view
  if (isClassView && pages.length > 0) {
    return (
      <FocusedPageView
        page={pages[currentPageIndex]}
        bookId={book.id}
        pageNumber={currentPageIndex + 1}
        totalPages={pages.length}
        previousPage={currentPageIndex > 0 ? pages[currentPageIndex - 1] : undefined}
        onNext={() => {
          if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
          }
        }}
        onPrevious={currentPageIndex > 0 ? () => {
          setCurrentPageIndex(currentPageIndex - 1);
        } : undefined}
        onExit={() => setIsClassView(false)}
      />
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
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {viewMode === 'admin' ? 'Preview User View' : 'Back to Admin View'}
              </Button>
            )}
          </div>

          {/* Content based on role and view mode */}
          {(!isAdmin || (isAdmin && viewMode === 'user')) ? (
            // User view or admin preview mode - show user-friendly page cards
            <div className="space-y-6">
              {pages.length > 0 ? (
                <>
                  <Button 
                    size="lg" 
                    className="w-full mb-6"
                    onClick={() => {
                      setIsClassView(true);
                      setCurrentPageIndex(0);
                    }}
                  >
                    Start
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.map((page) => (
                      <UserPageCard 
                        key={page.id} 
                        page={page} 
                        bookId={book.id}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">No pages created yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Admin view mode - show full content
            <>
              {/* Book Info */}
              <Card>
                <CardHeader>
                  {/* Call Illustration Director Button, Archive Button, and Delete Button (mobile only) - Above Title */}
                  <div className="mb-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateStyleGuide}
                      disabled={styleGuideLoading}
                      title="Call Illustration Director"
                      aria-label="Call Illustration Director"
                    >
                      {styleGuideLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Palette className="w-4 h-4" />
                      )}
                    </Button>
                    
                    {/* Archive button on mobile only */}
                    {isMobile && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={archiveLoading || book?.status === 'archived'}
                            title="Archive book"
                            aria-label="Archive book"
                          >
                            {archiveLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive Book</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to archive "{book?.book_name}"? Archived books will be hidden from your main book list but can be restored later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleArchiveBook}>
                              Archive Book
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {/* Delete button on mobile only */}
                    {isMobile && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={deleteLoading}
                            title="Delete book"
                            aria-label="Delete book"
                            className="text-destructive hover:text-destructive"
                          >
                            {deleteLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Book</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{book.book_name}"? This action cannot be undone and will permanently delete the book and all its pages, prompts, and images.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete Book
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

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
                      
                      {/* Archive button on desktop only */}
                      {!isMobile && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={archiveLoading || book?.status === 'archived'}
                              title="Archive book"
                              aria-label="Archive book"
                            >
                              {archiveLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Archive className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive Book</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to archive "{book?.book_name}"? Archived books will be hidden from your main book list but can be restored later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleArchiveBook}>
                                Archive Book
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {/* Delete button on desktop only */}
                      {!isMobile && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={deleteLoading}
                              title="Delete book"
                              aria-label="Delete book"
                              className="text-destructive hover:text-destructive"
                            >
                              {deleteLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Book</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{book.book_name}"? This action cannot be undone and will permanently delete the book and all its pages, prompts, and images.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete Book
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(book.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {book.category}
                    </div>
                     <Badge variant={book?.status === 'published' ? 'default' : 'secondary'}>
                       {book?.status}
                     </Badge>
                  </div>
                </CardContent>
              </Card>

               {/* System Prompt Section */}
               <SystemPromptSection 
                 bookId={book.id}
               />

               {/* Export & Action Section */}
               <ExportsSection 
                 contentType="book"
                 contentId={book.id}
                 contentName={book.book_name}
               />

               {/* Progress Console */}
               {progressMessages.length > 0 && (
                 <ProgressConsole 
                   messages={progressMessages}
                   isExpanded={isProgressExpanded}
                   onToggle={() => setIsProgressExpanded(!isProgressExpanded)}
                   isActive={styleGuideLoading}
                 />
               )}

              {/* Pages Section */}
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Pages ({pages.length}/{book.total_pages})</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Manage and edit the pages of your book.
                  </p>
                </div>
                {pages.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pages.map((page) => (
                      <PageCard 
                        key={page.id} 
                        page={page} 
                        bookId={book.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No pages created yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Pages will be created automatically when you generate the book content.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Container>
    </PageLayout>
  );
}