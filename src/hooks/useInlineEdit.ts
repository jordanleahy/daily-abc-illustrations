import { useState, useCallback } from 'react';
import { DailyContent } from '@/components/hero/types';
import { useToast } from '@/hooks/use-toast';

export const useInlineEdit = (initialContent: DailyContent) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<DailyContent>(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setEditedContent(initialContent);
    setHasChanges(false);
  }, [initialContent]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedContent(initialContent);
    setHasChanges(false);
  }, [initialContent]);

  const updateField = useCallback((field: keyof DailyContent, value: any) => {
    setEditedContent(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const updateArrayField = useCallback((field: 'subjects' | 'tags', value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    updateField(field, array);
  }, [updateField]);

  const saveChanges = useCallback(async (onSave?: (content: DailyContent) => Promise<void>) => {
    try {
      if (onSave) {
        await onSave(editedContent);
      }
      setIsEditing(false);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  }, [editedContent, toast]);

  return {
    isEditing,
    editedContent,
    hasChanges,
    startEdit,
    cancelEdit,
    updateField,
    updateArrayField,
    saveChanges,
  };
};