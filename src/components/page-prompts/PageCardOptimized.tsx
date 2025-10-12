import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UniversalInlineEdit } from '@/components/ui/universal-inline-edit';
import { useOptimisticInlineEdit } from '@/hooks/useOptimisticInlineEdit';
import { PageImageSection } from '@/components/PageImageSection';
import { Download, RefreshCw, Copy, Trash2, Upload } from 'lucide-react';
import { Page } from '@/types/book';
import { useAuthContext } from '@/contexts/AuthContext';

interface PageCardOptimizedProps {
  page: Page;
  bookId: string;
  onRegeneratePrompt?: () => void;
  onRegenerateImage?: () => void;
  onCopyPrompt?: () => void;
  onDownloadImage?: () => void;
  onDeletePage?: () => void;
  onUploadImage?: () => void;
  isRegenerating?: boolean;
}

export const PageCardOptimized: React.FC<PageCardOptimizedProps> = ({
  page,
  bookId,
  onRegeneratePrompt,
  onRegenerateImage,
  onCopyPrompt,
  onDownloadImage,
  onDeletePage,
  onUploadImage,
  isRegenerating = false,
}) => {
  const { user } = useAuthContext();

  const titleEdit = useOptimisticInlineEdit({
    initialValue: page.title || '',
    onSave: async (title) => {
      // This would typically call a Supabase update
      console.log('Saving title:', title);
    },
    debounceMs: 800,
  });

  const descriptionEdit = useOptimisticInlineEdit({
    initialValue: page.description || '',
    onSave: async (description) => {
      // This would typically call a Supabase update
      console.log('Saving description:', description);
    },
    debounceMs: 1000,
    validateFn: (description) => {
      if (description.length > 500) return 'Description must be less than 500 characters';
      return null;
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{page.letter}</span>
            </div>
            <div className="space-y-1 flex-1">
              <UniversalInlineEdit
                value={titleEdit.value}
                onSave={async (value) => titleEdit.updateValue(value)}
                placeholder={`Letter ${page.letter} - Add a title...`}
                isEditing={titleEdit.isEditing}
                isSaving={titleEdit.isSaving}
                saveStatus={titleEdit.saveStatus}
                error={titleEdit.error}
                hasChanges={titleEdit.hasChanges}
                onEditStart={titleEdit.startEdit}
                onEditCancel={titleEdit.cancelEdit}
                className="font-semibold text-lg"
                renderDisplay={(value) => (
                  <h3 className="font-semibold text-lg text-foreground">
                    {value || `Letter ${page.letter}`}
                  </h3>
                )}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyPrompt}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadImage}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeletePage}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <UniversalInlineEdit
          value={descriptionEdit.value}
          onSave={async (value) => descriptionEdit.updateValue(value)}
          placeholder="Add a description for this page..."
          multiline
          rows={2}
          maxLength={500}
          isEditing={descriptionEdit.isEditing}
          isSaving={descriptionEdit.isSaving}
          saveStatus={descriptionEdit.saveStatus}
          error={descriptionEdit.error}
          hasChanges={descriptionEdit.hasChanges}
          onEditStart={descriptionEdit.startEdit}
          onEditCancel={descriptionEdit.cancelEdit}
          className="text-sm"
          renderDisplay={(value) => (
            <p className="text-sm text-muted-foreground">
              {value || "Click to add a description..."}
            </p>
          )}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="aspect-square bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Page Image Placeholder</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegeneratePrompt}
            disabled={isRegenerating}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate Prompt
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateImage}
            disabled={isRegenerating}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate Image
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onUploadImage}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};