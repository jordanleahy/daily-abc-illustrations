import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { InlineQRCode } from '@/components/book/InlineQRCode';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useHasRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ProgressConsole, type ProgressMessage } from '@/components/ProgressConsole';
import { ProcessStatus } from '@/types/process';
import { ArrowLeft, Archive, Calendar, Users, Palette, Loader2, Trash2, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { useSystemPrompt } from "@/hooks/useSystemPrompt";
import { SystemPromptSection } from "@/components/book";
import { OpenGraphEditor } from "@/components/book/OpenGraphEditor";
import { ExportsSection } from '@/components/exports/ExportsSection';

import { PageImageSection } from "@/components/PageImageSection";
import { PageCard, UserPageCard, FocusedPageView } from '@/components/page-prompts';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentPrompt, refreshData } = useSystemPrompt(id || '');
  const { pages } = useBookPages(id);
  const { data: book, isLoading: bookLoading, error: bookError, isFetched: bookFetched } = useBook(id);
  const isAdmin = useHasRole('admin');
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [generateAllPromptsLoading, setGenerateAllPromptsLoading] = useState(false);
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
    
    try {
      // Show initial progress message
      setProgressMessages([{
        step: 'Style Guide Generation',
        message: 'Starting style guide generation...',
        timestamp: new Date().toISOString(),
        status: ProcessStatus.IN_PROGRESS
      }]);

      const { data, error } = await supabase.functions.invoke('generate-style-guide', {
        body: { bookId: book.id, userId: user.id, bookMetadata },
      });

      if (error) throw error;
      
      if (data?.success && data?.styleGuide) {
        // Show completion message
        setProgressMessages(prev => [...prev, {
          step: 'Complete',
          message: 'Style guide generated successfully!',
          timestamp: new Date().toISOString(),
          status: ProcessStatus.COMPLETE
        }]);
        
        // Force refresh the system prompt data
        await refreshData();
        console.log('Style guide generation completed, forcing cache refresh');
        
        toast.success('Style guide generated successfully!');
      } else {
        throw new Error(data?.error || 'No style guide returned');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'An error occurred while generating the style guide');
      setProgressMessages(prev => [...prev, {
        step: 'error',
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        status: ProcessStatus.ERROR
      }]);
    } finally {
      setStyleGuideLoading(false);
    }
  };

  const generateAllPagePrompts = async () => {
    if (!book || !user) return;
    
    setGenerateAllPromptsLoading(true);
    try {
      // Placeholder implementation
      toast.success('Generate All Page Prompts functionality coming soon!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('An error occurred while generating page prompts');
    } finally {
      setGenerateAllPromptsLoading(false);
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

      // Immediately invalidate the books cache to update UI
      queryClient.invalidateQueries({ queryKey: ['books', user.id] });

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

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateAllPagePrompts}
                      disabled={generateAllPromptsLoading}
                      title="Generate All Page Prompts"
                      aria-label="Generate All Page Prompts"
                    >
                      {generateAllPromptsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
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
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left side - Book metadata */}
                    <div className="flex-1">
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
                    </div>
                    
                    {/* Right side - QR Code */}
                    <div className="flex justify-center md:justify-end">
                      <InlineQRCode bookId={book.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>

               {/* OpenGraph Editor Section */}
                <OpenGraphEditor 
                  bookId={book.id}
                  bookTitle={book.book_name}
                  bookDescription={book.book_description}
                />


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