import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Upload, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { usePageSystemPrompt } from '@/hooks/usePageSystemPrompt';
import { PageImageSection } from '@/components/PageImageSection';
import { useAuthContext } from '@/contexts/AuthContext';
// Toast notifications removed
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { supabase } from '@/integrations/supabase/client';
import { useDeletePage } from '@/hooks/useDeletePage';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { useOptimisticInlineEdit } from '@/hooks/useOptimisticInlineEdit';
import { UniversalInlineEdit } from '@/components/ui/universal-inline-edit';
import { processImage } from '@/utils/imageProcessor';
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
import { useWordMetadata } from '@/hooks/useWordMetadata';

interface PageCardProps {
  page: Page;
  bookId: string;
  preloadedImageUrl?: string;
  onInsertBefore?: () => void;
  onInsertAfter?: () => void;
}

export function PageCard({ page, bookId, preloadedImageUrl, onInsertBefore, onInsertAfter }: PageCardProps) {
  const { 
    currentPrompt, 
    refreshData
  } = usePageSystemPrompt(page.id);
  const { user } = useAuthContext();
  const deletePage = useDeletePage();
  const { currentImage, uploadImage } = usePageImageUrls(page.id);
  const { generateMetadata } = useWordMetadata();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Optimistic inline editing for title
  const titleEdit = useOptimisticInlineEdit({
    initialValue: page.title,
    onSave: async (newTitle: string) => {
      const { error } = await supabase
        .from('pages')
        .update({ title: newTitle.trim() })
        .eq('id', page.id);
      if (error) throw error;
      
      // Regenerate word metadata to keep word carousel in sync
      try {
        await generateMetadata({
          pageId: page.id,
          bookId: bookId,
          title: newTitle.trim(),
          currentContent: page.content || {}
        });
      } catch (metadataError) {
        console.error('Failed to regenerate word metadata:', metadataError);
      }
    },
    debounceMs: 800,
    validateFn: (value: string) => {
      if (!value.trim()) return 'Title cannot be empty';
      if (value.length > 100) return 'Title is too long (max 100 characters)';
      return null;
    }
  });

  // Optimistic inline editing for description
  const descriptionEdit = useOptimisticInlineEdit({
    initialValue: page.description || '',
    onSave: async (newDescription: string) => {
      const { error } = await supabase
        .from('pages')
        .update({ description: newDescription.trim() || null })
        .eq('id', page.id);
      if (error) throw error;
    },
    debounceMs: 1000,
    validateFn: (value: string) => {
      if (value.length > 500) return 'Description is too long (max 500 characters)';
      return null;
    }
  });



  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Only check file type, skip size/aspect ratio - processImage handles compression
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      e.target.value = '';
      return;
    }
    
    console.log('Uploading image...');
    
    try {
      const processed = await processImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        targetSizeBytes: 500 * 1024,
        quality: 0.85,
      });

      const compressedFile = new File(
        [processed.blob],
        file.name.replace(/\.[^.]+$/, '.webp'),
        { type: processed.blob.type }
      );

      await uploadImage(compressedFile, bookId);
      console.log('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error(error.message || 'Failed to upload image');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeletePage = async () => {
    if (!user) {
      console.error('Please log in to delete pages');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deletePage.mutate(page.id);
    setShowDeleteConfirm(false);
  };

  const handleCopyDescription = async () => {
    if (!page.description) return;

    try {
      await copyToClipboard(page.description);
      console.log('Description copied to clipboard');
    } catch (error) {
      console.error('Error copying description to clipboard:', error);
      console.error('Failed to copy to clipboard');
    }
  };

  const handleCopyJsonPrompt = async () => {
    if (!currentPrompt?.content) return;

    try {
      await copyToClipboard(currentPrompt.content);
      console.log('JSON prompt copied to clipboard');
    } catch (error) {
      console.error('Error copying JSON prompt to clipboard:', error);
      console.error('Failed to copy to clipboard');
    }
  };

  const handleCopyFullPrompt = async () => {
    if (!currentImage?.prompt_used) return;

    // Skip if it's just an upload message
    if (currentImage.prompt_used.startsWith('User uploaded:')) {
      console.error('This image was uploaded, no AI prompt available');
      return;
    }

    try {
      await copyToClipboard(currentImage.prompt_used);
      console.log('Full prompt copied to clipboard');
    } catch (error) {
      console.error('Error copying full prompt to clipboard:', error);
      console.error('Failed to copy to clipboard');
    }
  };

  const handleDownloadImage = async () => {
    if (!currentImage?.image_url) {
      console.error('No image available to download');
      return;
    }

    try {
      const response = await fetch(currentImage.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      console.error('Failed to download image');
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow relative group">
      {/* Floating Insert Buttons - Desktop Only */}
      <div className="hidden md:block">
        {/* Insert Before Button (L+) */}
        {onInsertBefore && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-14 z-10 w-10 h-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={onInsertBefore}
            title="Insert page before this one"
          >
            <span className="text-xs font-bold">L+</span>
          </Button>
        )}
        
        {/* Insert After Button (R+) */}
        {onInsertAfter && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={onInsertAfter}
            title="Insert page after this one"
          >
            <span className="text-xs font-bold">R+</span>
          </Button>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleCopyDescription}
              disabled={!page.description}
              title="Copy description"
              aria-label="Copy description"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image for this page"
              aria-label="Upload image for this page"
            >
              <Upload className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleDownloadImage}
              disabled={!currentImage?.image_url}
              title="Download page image as PNG"
              aria-label="Download page image as PNG"
            >
              <Download className="w-3 h-3" />
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
          </div>
          <div className="flex items-center gap-2">
            {currentPrompt && (
              <Badge variant="secondary" className="text-xs">
                Version {currentPrompt.version_number}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {page.page_type === 'cover'
                ? 'Cover' 
                : page.page_type === 'educational'
                ? 'Educational Focus'
                : page.letter 
                  ? `Letter ${page.letter}`
                  : `Page ${page.page_number}`
              }
            </span>
          </div>
        </div>
        <UniversalInlineEdit
          value={titleEdit.value}
          onSave={async (value: string) => {
            titleEdit.updateValue(value);
          }}
          isEditing={titleEdit.isEditing}
          onEditStart={titleEdit.startEdit}
          onEditCancel={titleEdit.cancelEdit}
          isSaving={titleEdit.isSaving}
          saveStatus={titleEdit.saveStatus}
          error={titleEdit.error}
          hasChanges={titleEdit.hasChanges}
          placeholder="Enter page title"
          className="text-lg font-semibold"
          renderDisplay={(value) => (
            <CardTitle className="text-lg line-clamp-2 hover:bg-muted/50 rounded px-2 py-1 transition-colors">
              {value}
            </CardTitle>
          )}
        />
        {page.description !== undefined && (
          <UniversalInlineEdit
            value={descriptionEdit.value}
            onSave={async (value: string) => {
              descriptionEdit.updateValue(value);
            }}
            isEditing={descriptionEdit.isEditing}
            onEditStart={descriptionEdit.startEdit}
            onEditCancel={descriptionEdit.cancelEdit}
            isSaving={descriptionEdit.isSaving}
            saveStatus={descriptionEdit.saveStatus}
            error={descriptionEdit.error}
            hasChanges={descriptionEdit.hasChanges}
            multiline
            placeholder="Enter page description"
            className="text-sm text-muted-foreground"
            renderDisplay={(value) => value ? (
              <CardDescription className="line-clamp-2 hover:bg-muted/50 rounded px-2 py-1 transition-colors">
                {value}
              </CardDescription>
            ) : (
              <CardDescription className="text-muted-foreground/60 hover:bg-muted/50 rounded px-2 py-1 transition-colors italic">
                Click to add description...
              </CardDescription>
            )}
          />
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <PageImageSection 
          pageId={page.id}
          bookId={bookId}
          enableMobileSave={true}
          preloadedImageUrl={preloadedImageUrl}
        />
      </CardContent>

      {/* Hidden file input for direct upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

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