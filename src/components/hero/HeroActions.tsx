import { Button } from '@/components/ui/button';
import { Download, Edit, Save, X } from 'lucide-react';
import { AdminOnly } from '@/components/AdminOnly';

interface HeroActionsProps {
  price: string;
  downloadUrl: string;
  isEditing?: boolean;
  hasChanges?: boolean;
  onEditClick?: () => void;
  onSaveClick?: () => void;
  onCancelClick?: () => void;
}

export const HeroActions = ({ 
  price, 
  downloadUrl, 
  isEditing = false,
  hasChanges = false,
  onEditClick,
  onSaveClick,
  onCancelClick 
}: HeroActionsProps) => {
  const handleDownload = () => {
    // Handle download logic
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <AdminOnly>
        {isEditing ? (
          <div className="flex gap-2">
            <Button 
              onClick={onSaveClick}
              variant="default"
              size="sm"
              className="gap-2 min-h-[44px]"
              disabled={!hasChanges}
            >
              <Save size={16} />
              Save
            </Button>
            <Button 
              onClick={onCancelClick}
              variant="outline"
              size="sm"
              className="gap-2 min-h-[44px]"
            >
              <X size={16} />
              Cancel
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onEditClick}
            variant="outline" 
            size="sm"
            className="gap-2 min-h-[44px]"
          >
            <Edit size={16} />
            Edit Listing
          </Button>
        )}
      </AdminOnly>
      
      <Button 
        onClick={handleDownload}
        size="sm"
        className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white min-h-[44px]"
      >
        <Download size={16} />
        Download
      </Button>
    </div>
  );
};