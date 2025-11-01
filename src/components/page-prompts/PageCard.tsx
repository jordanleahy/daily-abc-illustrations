import { useState, useRef, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Upload, Download, Type } from 'lucide-react';
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

const ImageTextOverlayEditor = lazy(() =>
  import('./ImageTextOverlayEditor').then((module) => ({
    default: module.ImageTextOverlayEditor,
  }))
);
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DEBUG: Log the current state to diagnose "Copy Full Prompt" button issue
  console.log('[PageCard] Component rendered:', {
    pageId: page.id,
    pageTitle: page.title,
    currentImage: currentImage ? {
      id: currentImage.id,
      hasPromptUsed: !!currentImage.prompt_used,
      promptLength: currentImage.prompt_used?.length,
      sourceType: currentImage.source_type,
      generationStatus: currentImage.generation_status,
      promptPreview: currentImage.prompt_used?.substring(0, 100)
    } : 'NULL/UNDEFINED'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTextOverlayEditor, setShowTextOverlayEditor] = useState(false);

  // Optimistic inline editing for title
  const titleEdit = useOptimisticInlineEdit({
    initialValue: page.title,
    onSave: async (newTitle: string) => {
      const { error } = await supabase
        .from('pages')
        .update({ title: newTitle.trim() })
        .eq('id', page.id);
      if (error) throw error;
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



  const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' };
    }
    
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Supported formats: PNG, JPG, WEBP' };
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be smaller than 5MB' };
    }
    
    const isSquare = await checkAspectRatio(file);
    if (!isSquare) {
      return { valid: false, error: 'Image must have a 1:1 aspect ratio (square)' };
    }
    
    return { valid: true };
  };

  const checkAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isSquare = Math.abs(aspectRatio - 1) < 0.1;
        URL.revokeObjectURL(img.src);
        resolve(isSquare);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const validation = await validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = '';
      return;
    }
    
    const toastId = toast.loading('Uploading image...');
    
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
      toast.success('Image uploaded successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const handleDeletePage = async () => {
    if (!user) {
      toast.error('Please log in to delete pages');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deletePage.mutate(page.id);
    setShowDeleteConfirm(false);
  };

  const handleCopyDescription = async () => {
    if (!page.description) {
      toast.error('No description available');
      return;
    }

    try {
      await navigator.clipboard.writeText(page.description);
      toast.success('Description copied to clipboard');
    } catch (error) {
      console.error('Error copying description to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCopyJsonPrompt = async () => {
    if (!currentPrompt?.content) {
      toast.error('No JSON prompt available');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentPrompt.content);
      toast.success('JSON prompt copied to clipboard');
    } catch (error) {
      console.error('Error copying JSON prompt to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCopyFullPrompt = async () => {
    if (!currentImage?.prompt_used) {
      toast.error('No full prompt available');
      return;
    }

    // Skip if it's just an upload message
    if (currentImage.prompt_used.startsWith('User uploaded:')) {
      toast.error('This image was uploaded, no AI prompt available');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentImage.prompt_used);
      toast.success('Full prompt copied to clipboard');
    } catch (error) {
      console.error('Error copying full prompt to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownloadImage = async () => {
    if (!currentImage?.image_url) {
      toast.error('No image available to download');
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
      
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
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
              disabled={!currentImage?.image_url || currentImage?.generation_status !== 'complete'}
              title="Download page image as PNG"
              aria-label="Download page image as PNG"
            >
              <Download className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => setShowTextOverlayEditor(true)}
              disabled={!currentImage?.image_url || currentImage?.generation_status !== 'complete'}
              title={currentImage?.text_overlay_config ? "Edit text overlay" : "Add text overlay"}
              aria-label={currentImage?.text_overlay_config ? "Edit text overlay" : "Add text overlay"}
            >
              <Type className="w-3 h-3" />
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
              Page {page.page_number}
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

      {/* Text Overlay Editor */}
      {user && currentImage?.image_url && showTextOverlayEditor && (
        <Suspense fallback={null}>
          <ImageTextOverlayEditor
            open={showTextOverlayEditor}
            onOpenChange={setShowTextOverlayEditor}
            imageUrl={currentImage.image_url}
            defaultText={page.title}
            pageId={page.id}
            bookId={bookId}
            userId={user.id}
            existingConfig={currentImage.text_overlay_config}
          />
        </Suspense>
      )}
    </Card>
  );
}