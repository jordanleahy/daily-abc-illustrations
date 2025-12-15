import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Trash2, X } from 'lucide-react';

interface BulkDeleteBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteConfirm: () => void;
  isDeleting: boolean;
}

export function BulkDeleteBar({
  selectedCount,
  onClearSelection,
  onDeleteConfirm,
  isDeleting,
}: BulkDeleteBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border border-border shadow-xl rounded-lg px-4 py-3 flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedCount} book{selectedCount > 1 ? 's' : ''} selected
      </span>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isDeleting}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
        
        <DeleteConfirmDialog
          title={`Delete ${selectedCount} book${selectedCount > 1 ? 's' : ''}?`}
          description="This action cannot be undone. This will permanently delete all pages, images, and content for the selected books."
          onConfirm={onDeleteConfirm}
          isDeleting={isDeleting}
          trigger={
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </Button>
          }
        />
      </div>
    </div>
  );
}
