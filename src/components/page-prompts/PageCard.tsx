import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { RefreshCw, FileText, Copy, Trash2, Edit3 } from 'lucide-react';
import { usePageSystemPrompt } from '@/hooks/usePageSystemPrompt';
import { PageImageSection } from '@/components/PageImageSection';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDeletePage } from '@/hooks/useDeletePage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Page } from '@/types/book';

interface PageCardProps {
  page: Page;
  bookId: string;
}

export function PageCard({ page, bookId }: PageCardProps) {
  const { currentPrompt, refreshData } = usePageSystemPrompt(page.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const deletePage = useDeletePage();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const [editDescription, setEditDescription] = useState(page.description || '');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRegeneratePrompt = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to regenerate prompts",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRegenerating(true);
      
      const { error } = await supabase.functions.invoke('generate-image-prompt', {
        body: {
          pageId: page.id,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page prompt regenerated successfully",
      });

      // Refresh the prompt data to show the new version
      refreshData();
    } catch (error) {
      console.error('Error regenerating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate page prompt",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleEditPage = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to edit pages",
        variant: "destructive",
      });
      return;
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        })
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: "Page Updated",
        description: "Page title and description have been updated successfully.",
      });

      setIsEditing(false);
      setShowSaveConfirm(false);
    } catch (error) {
      console.error('Error updating page:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the page. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSave = () => {
    setShowSaveConfirm(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(page.title);
    setEditDescription(page.description || '');
    setIsEditing(false);
  };

  const handleDeletePage = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete pages",
        variant: "destructive",
      });
      return;
    }

    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deletePage.mutate(page.id);
    setShowDeleteConfirm(false);
  };

  const handleCopyPrompt = async () => {
    if (!currentPrompt?.content) return;

    try {
      await navigator.clipboard.writeText(currentPrompt.content);
      toast({
        title: "Copied!",
        description: "System prompt copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              {page.letter}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleRegeneratePrompt}
              disabled={isRegenerating}
              title="Regenerate page prompt"
              aria-label="Regenerate page prompt"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleEditPage}
              disabled={isEditing}
              title="Edit page title and description"
              aria-label="Edit page title and description"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleDeletePage}
              disabled={deletePage.isPending}
              title="Delete page"
              aria-label="Delete page"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
            {currentPrompt && (
              <Toggle
                size="sm"
                className="w-6 h-6"
                pressed={showPrompt}
                onPressedChange={setShowPrompt}
                title="Toggle between image and prompt view"
                aria-label="Toggle between image and prompt view"
              >
                <FileText className="w-3 h-3" />
              </Toggle>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentPrompt && (
              <Badge variant="secondary" className="text-xs">
                Version {currentPrompt.version_number}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page.page_number}
            </span>
          </div>
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg font-semibold bg-transparent border-b border-border focus:border-primary outline-none"
              placeholder="Enter page title"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full text-sm text-muted-foreground bg-transparent border-b border-border focus:border-primary outline-none resize-none"
              placeholder="Enter page description"
              rows={2}
            />
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleConfirmSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <CardTitle className="text-lg line-clamp-2">
              {page.title}
            </CardTitle>
            {page.description && (
              <CardDescription className="line-clamp-2">
                {page.description}
              </CardDescription>
            )}
          </>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {showPrompt && currentPrompt ? (
          <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-sm font-medium text-foreground p-3 pb-2 border-b border-border/50">
              <span>System Prompt:</span>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={handleCopyPrompt}
                title="Copy system prompt to clipboard"
                aria-label="Copy system prompt to clipboard"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {currentPrompt.content}
              </div>
            </div>
          </div>
        ) : (
          <PageImageSection 
            pageId={page.id}
            bookId={bookId}
          />
        )}
      </CardContent>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes to "{page.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-4">
                <div>
                  <span className="font-medium">Title:</span> {editTitle}
                </div>
                <div>
                  <span className="font-medium">Description:</span> {editDescription || '(No description)'}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{page.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and will also delete all associated images and prompts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}