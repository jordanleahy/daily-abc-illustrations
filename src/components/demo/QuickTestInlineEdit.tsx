import { useState } from 'react';
import { UniversalInlineEdit } from '@/components/ui/universal-inline-edit';
import { useOptimisticInlineEdit } from '@/hooks/useOptimisticInlineEdit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const QuickTestInlineEdit = () => {
  const [mockTitle, setMockTitle] = useState('Test Book Title');
  const [mockDescription, setMockDescription] = useState('This is a test description that can be edited in real-time.');

  const titleEdit = useOptimisticInlineEdit({
    initialValue: mockTitle,
    onSave: async (title) => {
      console.log('💾 Saving title:', title);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setMockTitle(title);
      console.log('✅ Title saved successfully');
    },
    debounceMs: 500,
  });

  const descriptionEdit = useOptimisticInlineEdit({
    initialValue: mockDescription,
    onSave: async (description) => {
      console.log('💾 Saving description:', description);
      // Simulate API call with potential error
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (description.includes('error')) {
        throw new Error('Simulated save error - remove "error" from text');
      }
      setMockDescription(description);
      console.log('✅ Description saved successfully');
    },
    debounceMs: 1000,
    validateFn: (value) => {
      if (value.length > 200) return 'Description must be less than 200 characters';
      return null;
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Inline Edit Test Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Title (auto-saves after 500ms)
            </label>
            <UniversalInlineEdit
              value={titleEdit.value}
              onSave={async (value) => titleEdit.updateValue(value)}
              placeholder="Enter a title..."
              isEditing={titleEdit.isEditing}
              isSaving={titleEdit.isSaving}
              saveStatus={titleEdit.saveStatus}
              error={titleEdit.error}
              hasChanges={titleEdit.hasChanges}
              onEditStart={titleEdit.startEdit}
              onEditCancel={titleEdit.cancelEdit}
              className="text-lg font-semibold"
              renderDisplay={(value) => (
                <h2 className="text-lg font-semibold text-foreground cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors">
                  {value || "Click to edit title..."}
                </h2>
              )}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description (auto-saves after 1000ms, max 200 chars)
            </label>
            <UniversalInlineEdit
              value={descriptionEdit.value}
              onSave={async (value) => descriptionEdit.updateValue(value)}
              multiline
              rows={4}
              maxLength={200}
              placeholder="Enter a description... (try typing 'error' to test error handling)"
              isEditing={descriptionEdit.isEditing}
              isSaving={descriptionEdit.isSaving}
              saveStatus={descriptionEdit.saveStatus}
              error={descriptionEdit.error}
              hasChanges={descriptionEdit.hasChanges}
              onEditStart={descriptionEdit.startEdit}
              onEditCancel={descriptionEdit.cancelEdit}
              renderDisplay={(value) => (
                <p className="text-muted-foreground leading-relaxed cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors">
                  {value || "Click to edit description..."}
                </p>
              )}
            />
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current State:</h4>
            <div className="text-sm space-y-1">
              <div>Actual Title: <span className="font-mono">{mockTitle}</span></div>
              <div>Actual Description: <span className="font-mono">{mockDescription}</span></div>
              <div>Title Status: <span className="font-mono">{titleEdit.saveStatus}</span></div>
              <div>Description Status: <span className="font-mono">{descriptionEdit.saveStatus}</span></div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Click on title or description to start editing</li>
              <li>Changes auto-save after typing stops</li>
              <li>Try typing "error" in description to test error handling</li>
              <li>Use Escape to cancel, Enter (or Ctrl+Enter for textarea) to save immediately</li>
              <li>Watch console for save events</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};