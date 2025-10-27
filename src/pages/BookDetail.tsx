import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { trackBookView } from '@/utils/bookViewTracking';
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

import { useAuthContext } from '@/contexts/AuthContext';
import { InlineQRCode } from '@/components/book/InlineQRCode';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useHasRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ProgressConsole, type ProgressMessage } from '@/components/ProgressConsole';
import { ProcessStatus } from '@/types/process';
import { PublicationStatus } from '@/types/status';
import { ArrowLeft, Archive, Calendar, Users, Palette, Loader2, Trash2, Eye, FileText, Star, Copy, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { useToggleBookHighlight } from '@/hooks/useToggleBookHighlight';
import { useDuplicateBook } from '@/hooks/useDuplicateBook';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { InlineEditTextarea } from '@/components/ui/inline-edit-textarea';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSystemPrompt } from "@/hooks/useSystemPrompt";
import { SystemPromptSection } from "@/components/book";
import { OpenGraphEditor } from "@/components/book/OpenGraphEditor";
import { ExportsSection } from '@/components/exports/ExportsSection';

import { PageImageSection } from "@/components/PageImageSection";
import { PageCard, UserPageCard, FocusedPageView } from '@/components/page-prompts';
import { CreatePageModal } from '@/components/page-prompts/CreatePageModal';
import { FloatingInsertZone } from '@/components/page-prompts/FloatingInsertZone';
import { InsertPageDialog } from '@/components/page-prompts/InsertPageDialog';
import { useInsertPage } from '@/hooks/useInsertPage';
import { Plus } from 'lucide-react';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentPrompt, refreshData } = useSystemPrompt(id || '');
  const { pages } = useBookPages(id);
  const { data: book, isLoading: bookLoading, error: bookError, isFetched: bookFetched } = useBook(id);
  const isAdmin = useHasRole('admin');
  const isMobile = useIsMobile();
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [generateAllPromptsLoading, setGenerateAllPromptsLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [isProgressExpanded, setIsProgressExpanded] = useState(true);
  const [isClassView, setIsClassView] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);
  
  // Insert page state
  const [isInsertDialogOpen, setIsInsertDialogOpen] = useState(false);
  const [insertAfterPageNumber, setInsertAfterPageNumber] = useState(0);
  const [insertReferenceTitle, setInsertReferenceTitle] = useState('');
  const insertPage = useInsertPage();
  
  const { mutate: toggleHighlight, isPending: isHighlightLoading } = useToggleBookHighlight();
  const { mutate: duplicateBook, isPending: isDuplicating } = useDuplicateBook();
  

  useEffect(() => {
    // Wait for auth loading to complete before checking user status
    if (authLoading) return;
    
    if ((!user || !id) && location.pathname !== '/auth') {
      navigate('/auth');
      return;
    }
    
    // Track book view when component loads
    if (user && id && book) {
      trackBookView(id);
      // Invalidate books query to update sort order
      queryClient.invalidateQueries({ queryKey: ['books', user.id] });
    }
  }, [user, id, navigate, authLoading, location.pathname, book, queryClient]);

  // Handle book not found only after auth and query have both completed
  useEffect(() => {
    if (!authLoading && user && id && bookFetched && !book) {
      toast.error('Book not found');
      navigate('/editor');
    }
  }, [authLoading, user, id, bookFetched, book, navigate]);

  const handleBack = () => {
    navigate('/editor');
  };

  const generateStyleGuide = async () => {
    if (!book || !user) return;
    
    setStyleGuideLoading(true);
    setProgressMessages([]);
    
    try {
      const response = await supabase.functions.invoke('generate-style-guide', {
        body: {
          bookId: book.id,
          userId: user.id,
          bookMetadata: {
            book_name: book.book_name,
            category: book.category || 'General',
            book_description: book.book_description || ''
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate style guide');
      }

      const result = response.data;
      
      if (result.success) {
        setProgressMessages(prev => [...prev, {
          step: 'Style Guide Generation',
          message: result.message || 'Style guide generated successfully',
          status: 'success' as ProcessStatus,
          timestamp: new Date().toISOString()
        }]);
        
        // Refresh the system prompt data to show the updated style guide
        await refreshData();
        
        toast.success('Style guide generated successfully');
      } else {
        throw new Error(result.error || 'Failed to generate style guide');
      }
    } catch (error: any) {
      console.error('Error generating style guide:', error);
      const errorMessage = error.message || 'Failed to generate style guide';
      
      setProgressMessages(prev => [...prev, {
        step: 'Style Guide Generation',
        message: errorMessage,
        status: 'error' as ProcessStatus,
        timestamp: new Date().toISOString()
      }]);
      
      toast.error(errorMessage);
    } finally {
      setStyleGuideLoading(false);
    }
  };

  const generateAllPagePrompts = async () => {
    // Placeholder for generating all page prompts
    setGenerateAllPromptsLoading(true);
    
    try {
      // TODO: Implement the actual logic for generating all page prompts
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
      toast.success('All page prompts generated successfully');
    } catch (error) {
      console.error('Error generating page prompts:', error);
      toast.error('Failed to generate page prompts');
    } finally {
      setGenerateAllPromptsLoading(false);
    }
  };

  const handleArchiveBook = async () => {
    if (!book?.id) return;
    
    setArchiveLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .update({ status: 'archived' })
        .eq('id', book.id);

      if (error) throw error;

      toast.success('Book archived successfully');
      navigate('/editor');
    } catch (error) {
      console.error('Error archiving book:', error);
      toast.error('Failed to archive book');
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
      navigate('/editor');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('An error occurred while deleting the book');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateDescription = async (newDescription: string) => {
    if (!book?.id) return;
    
    try {
      const { error } = await supabase
        .from('books')
        .update({ book_description: newDescription })
        .eq('id', book.id);

      if (error) throw error;

      // Invalidate and refetch the book data
      queryClient.invalidateQueries({ queryKey: ['book', book.id] });
      
      toast.success("Book description updated successfully");
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating book description:', error);
      toast.error("Failed to update book description");
    }
  };

  const handleUpdateBookName = async (newName: string) => {
    if (!book?.id || newName === book.book_name) {
      setIsEditingTitle(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('books')
        .update({ book_name: newName })
        .eq('id', book.id);

      if (error) throw error;

      // Invalidate and refetch the book query
      queryClient.invalidateQueries({ queryKey: ['book', book.id] });
      toast.success('Book title updated successfully');
    } catch (error) {
      console.error('Error updating book name:', error);
      toast.error('Failed to update book title');
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleUpdateCategory = async (newCategory: string) => {
    if (!book?.id || newCategory === book.category) {
      setIsEditingCategory(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('books')
        .update({ category: newCategory })
        .eq('id', book.id);

      if (error) throw error;

      // Invalidate and refetch the book query
      queryClient.invalidateQueries({ queryKey: ['book', book.id] });
      toast.success('Book theme updated successfully');
    } catch (error) {
      console.error('Error updating book theme:', error);
      toast.error('Failed to update book theme');
    } finally {
      setIsEditingCategory(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!book?.id || newStatus === book.status) {
      setIsEditingStatus(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('books')
        .update({ status: newStatus as PublicationStatus })
        .eq('id', book.id);

      if (error) throw error;

      // Invalidate and refetch the book query
      queryClient.invalidateQueries({ queryKey: ['book', book.id] });
      // Also invalidate highlighted books query if status changed to/from published
      queryClient.invalidateQueries({ queryKey: ['public-highlighted-books'] });
      
      toast.success(`Book status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error updating book status:', error);
      toast.error('Failed to update book status');
    } finally {
      setIsEditingStatus(false);
    }
  };

  const handleAddTag = async () => {
    if (!book?.id || !newTag.trim()) return;
    
    const currentTags = book.tags || [];
    if (currentTags.includes(newTag.trim())) {
      toast.error('Tag already exists');
      return;
    }
    
    const updatedTags = [...currentTags, newTag.trim()];
    
    try {
      const { error } = await supabase
        .from('books')
        .update({ tags: updatedTags })
        .eq('id', book.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['book', book.id] });
      setNewTag('');
      toast.success('Tag added');
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!book?.id) return;
    
    const updatedTags = (book.tags || []).filter(tag => tag !== tagToRemove);
    
    try {
      const { error } = await supabase
        .from('books')
        .update({ tags: updatedTags })
        .eq('id', book.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['book', book.id] });
      toast.success('Tag removed');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  if (authLoading || (user && !bookFetched)) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading book..." />
      </StandardPageLayout>
    );
  }

  if (!book) {
    return (
      <StandardPageLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Book not found</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Books
          </Button>
        </div>
      </StandardPageLayout>
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
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="p-2 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Books
          </Button>
        </div>

          {/* Progress Console */}
          {progressMessages.length > 0 && (
            <ProgressConsole
              messages={progressMessages}
              isExpanded={isProgressExpanded}
              onToggle={() => setIsProgressExpanded(!isProgressExpanded)}
              isActive={styleGuideLoading}
            />
          )}
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
                    
                    <Button
                      variant={book.is_highlighted ? "default" : "outline"}
                      size="icon"
                      onClick={() => toggleHighlight({ bookId: book.id, isHighlighted: book.is_highlighted || false })}
                      disabled={isHighlightLoading}
                      title={book.is_highlighted ? "Remove from Landing Page" : "Highlight on Landing Page"}
                      aria-label={book.is_highlighted ? "Remove from Landing Page" : "Highlight on Landing Page"}
                    >
                      {isHighlightLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className={`w-4 h-4 ${book.is_highlighted ? 'fill-current' : ''}`} />
                      )}
                    </Button>

                    {/* Add new page button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreatePageModalOpen(true)}
                      title="Add new page"
                      aria-label="Add new page"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>

                    {/* Duplicate book button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (user && book) {
                          duplicateBook(
                            { bookId: book.id, userId: user.id },
                            {
                              onSuccess: (newBook) => {
                                navigate(`/editor/${newBook.id}`);
                              },
                            }
                          );
                        }
                      }}
                      disabled={isDuplicating}
                      title="Duplicate book"
                      aria-label="Duplicate book"
                    >
                      {isDuplicating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
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
                      <InlineEditInput
                        value={book.book_name}
                        onSave={handleUpdateBookName}
                        isEditing={isEditingTitle}
                        className="text-2xl font-semibold"
                        placeholder="Enter book title"
                        renderDisplay={(value) => (
                          <CardTitle 
                            className="text-2xl cursor-pointer hover:text-primary transition-colors" 
                            onClick={() => setIsEditingTitle(true)}
                          >
                            {value}
                          </CardTitle>
                        )}
                      />
                      <InlineEditTextarea
                        value={book.book_description || ''}
                        onSave={handleUpdateDescription}
                        isEditing={isEditingDescription}
                        className="text-base text-muted-foreground"
                        placeholder="Enter book description"
                        renderDisplay={(value) => (
                          <CardDescription 
                            className="text-base cursor-pointer hover:text-primary transition-colors" 
                            onClick={() => setIsEditingDescription(true)}
                          >
                            {value || 'Click to add description...'}
                          </CardDescription>
                        )}
                      />
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
                          <InlineEditInput
                            value={book.category || ''}
                            onSave={handleUpdateCategory}
                            isEditing={isEditingCategory}
                            className="text-sm"
                            placeholder="Enter theme"
                            renderDisplay={(value) => (
                              <span 
                                className="cursor-pointer hover:text-primary transition-colors" 
                                onClick={() => setIsEditingCategory(true)}
                              >
                                {value || 'No theme set'}
                              </span>
                            )}
                          />
                        </div>
                        {isEditingStatus ? (
                          <Select 
                            value={book.status} 
                            onValueChange={(value) => {
                              handleUpdateStatus(value);
                            }}
                          >
                            <SelectTrigger className="w-[120px] h-7 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge 
                            variant={book?.status === 'published' ? 'default' : 'secondary'}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setIsEditingStatus(true)}
                          >
                            {book?.status}
                          </Badge>
                        )}
                      </div>

                      {/* Tags Section */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          {book.tags && book.tags.length > 0 ? (
                            book.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary"
                                className="group relative pr-6"
                              >
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove tag"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No tags</span>
                          )}
                          {isEditingTags ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddTag();
                                  } else if (e.key === 'Escape') {
                                    setIsEditingTags(false);
                                    setNewTag('');
                                  }
                                }}
                                placeholder="Enter tag name"
                                className="px-2 py-1 text-sm border rounded"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleAddTag}
                              >
                                Add
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsEditingTags(false);
                                  setNewTag('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsEditingTags(true)}
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              Add Tag
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - QR Code */}
                    <div className="flex justify-center md:justify-end">
                      <InlineQRCode bookId={book.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* OpenGraph Editor */}
              <OpenGraphEditor 
                bookId={book.id} 
                bookTitle={book.book_name}
                bookDescription={book.book_description}
              />

              {/* System Prompt Section */}
              <SystemPromptSection bookId={book.id} />

              {/* Exports Section */}
              <ExportsSection 
                contentType="book"
                contentId={book.id}
                contentName={book.book_name}
              />

              {/* Pages Grid (Admin View) with Interleaved Insert Zones */}
              <div className="flex flex-wrap gap-4">
                {pages && pages.length > 0 && (() => {
                  return (
                    <>
                      {/* Insert at beginning - full width */}
                      <div className="w-full">
                        <FloatingInsertZone
                          onInsert={() => {
                            setInsertAfterPageNumber(0);
                            setInsertReferenceTitle('Beginning');
                            setIsInsertDialogOpen(true);
                          }}
                          position="before"
                          isFirst
                        />
                      </div>
                      
                      {/* Interleave cards and insert zones */}
                      {pages.map((page, index) => (
                        <React.Fragment key={page.id}>
                          {/* Page card with fixed width for 3-column layout */}
                          <div className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]">
                            <PageCard
                              page={page}
                              bookId={book.id}
                            />
                          </div>

                          {/* Insert zone after each card (except last) */}
                          {index < pages.length - 1 && (
                            <FloatingInsertZone
                              onInsert={() => {
                                setInsertAfterPageNumber(page.page_number);
                                setInsertReferenceTitle(page.title);
                                setIsInsertDialogOpen(true);
                              }}
                              position="after"
                            />
                          )}
                        </React.Fragment>
                      ))}
                      
                      {/* Insert at end - full width */}
                      <div className="w-full">
                        <FloatingInsertZone
                          onInsert={() => {
                            const lastPage = pages[pages.length - 1];
                            setInsertAfterPageNumber(lastPage.page_number);
                            setInsertReferenceTitle(lastPage.title);
                            setIsInsertDialogOpen(true);
                          }}
                          position="after"
                          isLast
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Create Page Modal */}
              <CreatePageModal
                open={isCreatePageModalOpen}
                onOpenChange={setIsCreatePageModalOpen}
                bookId={book.id}
                existingPages={pages?.length || 0}
              />

              {/* Insert Page Dialog */}
              <InsertPageDialog
                open={isInsertDialogOpen}
                onOpenChange={setIsInsertDialogOpen}
                onInsert={async (title, description) => {
                  await insertPage.mutateAsync({
                    bookId: book.id,
                    insertAfterPageNumber,
                    title,
                    description,
                  });
                  setIsInsertDialogOpen(false);
                }}
                position={insertAfterPageNumber === 0 ? 'before' : 'after'}
                referencePage={insertReferenceTitle}
                isPending={insertPage.isPending}
              />
      </div>
    </StandardPageLayout>
  );
}