import React from 'react';
import { format } from 'date-fns';
import { UniversalInlineEdit } from '@/components/ui/universal-inline-edit';
import { useOptimisticInlineEdit } from '@/hooks/useOptimisticInlineEdit';
import { HeroActions } from './HeroActions';
import { DailyContent } from './types';

interface HeroSpecsOptimizedProps {
  content: DailyContent;
  onSave: (content: DailyContent) => Promise<void>;
  downloadUrl?: string;
  className?: string;
}

export const HeroSpecsOptimized: React.FC<HeroSpecsOptimizedProps> = ({
  content,
  onSave,
  downloadUrl,
  className = '',
}) => {
  const titleEdit = useOptimisticInlineEdit({
    initialValue: content.title,
    onSave: async (title) => onSave({ ...content, title }),
    debounceMs: 800,
  });

  const priceEdit = useOptimisticInlineEdit({
    initialValue: content.price,
    onSave: async (price) => onSave({ ...content, price }),
    debounceMs: 800,
    validateFn: (price) => {
      if (!price.trim()) return 'Price cannot be empty';
      if (!/^\$\d+(\.\d{2})?$/.test(price.trim())) return 'Price must be in format $X.XX';
      return null;
    },
  });

  const gradeEdit = useOptimisticInlineEdit({
    initialValue: content.grade,
    onSave: async (grade) => onSave({ ...content, grade }),
    debounceMs: 800,
  });

  const subjectsEdit = useOptimisticInlineEdit({
    initialValue: content.subjects.join(', '),
    onSave: async (subjectsStr) => {
      const subjects = subjectsStr.split(',').map(s => s.trim()).filter(Boolean);
      await onSave({ ...content, subjects });
    },
    debounceMs: 1000,
  });

  const tagsEdit = useOptimisticInlineEdit({
    initialValue: content.tags.join(', '),
    onSave: async (tagsStr) => {
      const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
      await onSave({ ...content, tags });
    },
    debounceMs: 1000,
  });

  const hasAnyChanges = titleEdit.hasChanges || priceEdit.hasChanges || 
                       gradeEdit.hasChanges || subjectsEdit.hasChanges || tagsEdit.hasChanges;

  const isAnySaving = titleEdit.isSaving || priceEdit.isSaving || 
                     gradeEdit.isSaving || subjectsEdit.isSaving || tagsEdit.isSaving;

  const saveAll = async () => {
    const promises = [];
    if (titleEdit.hasChanges) promises.push(titleEdit.saveNow());
    if (priceEdit.hasChanges) promises.push(priceEdit.saveNow());
    if (gradeEdit.hasChanges) promises.push(gradeEdit.saveNow());
    if (subjectsEdit.hasChanges) promises.push(subjectsEdit.saveNow());
    if (tagsEdit.hasChanges) promises.push(tagsEdit.saveNow());
    
    await Promise.all(promises);
  };

  const cancelAll = () => {
    titleEdit.cancelEdit();
    priceEdit.cancelEdit();
    gradeEdit.cancelEdit();
    subjectsEdit.cancelEdit();
    tagsEdit.cancelEdit();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Title</label>
          <UniversalInlineEdit
            value={titleEdit.value}
            onSave={async (value) => titleEdit.updateValue(value)}
            placeholder="Enter title..."
            isEditing={titleEdit.isEditing}
            isSaving={titleEdit.isSaving}
            saveStatus={titleEdit.saveStatus}
            error={titleEdit.error}
            hasChanges={titleEdit.hasChanges}
            onEditStart={titleEdit.startEdit}
            onEditCancel={titleEdit.cancelEdit}
            className="font-semibold"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Price</label>
          <UniversalInlineEdit
            value={priceEdit.value}
            onSave={async (value) => priceEdit.updateValue(value)}
            placeholder="$0.00"
            isEditing={priceEdit.isEditing}
            isSaving={priceEdit.isSaving}
            saveStatus={priceEdit.saveStatus}
            error={priceEdit.error}
            hasChanges={priceEdit.hasChanges}
            onEditStart={priceEdit.startEdit}
            onEditCancel={priceEdit.cancelEdit}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Grade Level</label>
          <UniversalInlineEdit
            value={gradeEdit.value}
            onSave={async (value) => gradeEdit.updateValue(value)}
            placeholder="e.g., Pre-K, K-2"
            isEditing={gradeEdit.isEditing}
            isSaving={gradeEdit.isSaving}
            saveStatus={gradeEdit.saveStatus}
            error={gradeEdit.error}
            hasChanges={gradeEdit.hasChanges}
            onEditStart={gradeEdit.startEdit}
            onEditCancel={gradeEdit.cancelEdit}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Published</label>
          <span className="block py-2 px-3 bg-muted/30 rounded text-sm">
            {format(new Date(content.publishedDate), 'MMM dd, yyyy')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Subjects</label>
          <UniversalInlineEdit
            value={subjectsEdit.value}
            onSave={async (value) => subjectsEdit.updateValue(value)}
            placeholder="e.g., Reading, Math, Science"
            isEditing={subjectsEdit.isEditing}
            isSaving={subjectsEdit.isSaving}
            saveStatus={subjectsEdit.saveStatus}
            error={subjectsEdit.error}
            hasChanges={subjectsEdit.hasChanges}
            onEditStart={subjectsEdit.startEdit}
            onEditCancel={subjectsEdit.cancelEdit}
            renderDisplay={(value) => (
              <div className="flex flex-wrap gap-1">
                {value.split(',').filter(Boolean).map((subject, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {subject.trim()}
                  </span>
                ))}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tags</label>
          <UniversalInlineEdit
            value={tagsEdit.value}
            onSave={async (value) => tagsEdit.updateValue(value)}
            placeholder="e.g., alphabet, phonics, vocabulary"
            isEditing={tagsEdit.isEditing}
            isSaving={tagsEdit.isSaving}
            saveStatus={tagsEdit.saveStatus}
            error={tagsEdit.error}
            hasChanges={tagsEdit.hasChanges}
            onEditStart={tagsEdit.startEdit}
            onEditCancel={tagsEdit.cancelEdit}
            renderDisplay={(value) => (
              <div className="flex flex-wrap gap-1">
                {value.split(',').filter(Boolean).map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-secondary/20 text-secondary-foreground text-xs rounded-full">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      <HeroActions
        price={content.price}
        downloadUrl={downloadUrl || ''}
        isEditing={hasAnyChanges}
        hasChanges={hasAnyChanges}
        onEditClick={() => {}} // Not needed with auto-edit
        onSaveClick={saveAll}
        onCancelClick={cancelAll}
      />
    </div>
  );
};