import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { ProgressConsole, type ProgressMessage } from '@/components/ProgressConsole';
import { ProcessStatus } from '@/types/process';
import { ArrowLeft, Archive, Calendar, Users, Palette, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useSystemPrompt } from "@/hooks/useSystemPrompt";
import { SystemPromptSection } from "@/components/book";
import { ExportsSection } from '@/components/exports/ExportsSection';

import { PageImageSection } from "@/components/PageImageSection";
import { PageCard } from '@/components/page-prompts';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { currentPrompt, refreshData } = useSystemPrompt(id || '');
  const { pages } = useBookPages(id);
  const { data: book, isLoading: bookLoading, error: bookError, isFetched: bookFetched } = useBook(id);
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  

  useEffect(() => {
    // Wait for auth loading to complete before checking user status
    if (authLoading) return;
    
    if (!user || !id) {
      navigate('/auth');
      return;
    }
  }, [user, id, navigate, authLoading]);

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
              {/* Call Illustration Director Button - Above Title */}
              <div className="mb-4">
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
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={archiveLoading || book?.status === 'archived'}
                        className="flex items-center gap-2"
                      >
                        {archiveLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                        Archive
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
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteLoading}
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
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
                        <AlertDialogAction
                          onClick={handleDeleteBook}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Book
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Badge variant={book.status === 'published' ? "default" : "secondary"}>
                    {book.status === 'published' ? 'Published' : book.status === 'draft' ? 'Draft' : 'Archived'}
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

          {/* Exports Section */}
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

          {/* Pages Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <PageCard 
                key={page.id} 
                page={page} 
                bookId={book.id} 
              />
            ))}
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}