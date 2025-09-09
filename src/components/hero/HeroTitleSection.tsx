import { Button } from '@/components/ui/button';
import { Download, Edit } from 'lucide-react';
import { HeroActions } from './HeroActions';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { format } from 'date-fns';

interface HeroTitleSectionProps {
  title: string;
  price: string;
  downloadUrl: string;
  publishedDate: string;
  isEditing?: boolean;
  hasChanges?: boolean;
  onEditClick?: () => void;
  onSaveClick?: () => void;
  onCancelClick?: () => void;
  onUpdateField?: (field: string, value: any) => void;
}

export const HeroTitleSection = ({ 
  title, 
  price, 
  downloadUrl, 
  publishedDate,
  isEditing = false,
  hasChanges = false,
  onEditClick,
  onSaveClick,
  onCancelClick,
  onUpdateField
}: HeroTitleSectionProps) => {
  const formattedDate = format(new Date(publishedDate), 'MMMM d, yyyy');
  
  return (
    <div className="space-y-3">
      <InlineEditInput
        value={title}
        onSave={(value) => onUpdateField?.('title', value)}
        isEditing={isEditing}
        renderDisplay={(value) => (
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{value}</h1>
        )}
        className="text-2xl md:text-3xl font-bold text-foreground w-full border-none p-0 focus-visible:ring-0"
      />
      <InlineEditInput
        value={price}
        onSave={(value) => onUpdateField?.('price', value)}
        isEditing={isEditing}
        renderDisplay={(value) => (
          <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
        )}
        className="text-xl md:text-2xl font-bold text-foreground w-full border-none p-0 focus-visible:ring-0"
      />
      <p className="text-sm text-muted-foreground">Published {formattedDate}</p>
      <HeroActions 
        price={price}
        downloadUrl={downloadUrl}
        isEditing={isEditing}
        hasChanges={hasChanges}
        onEditClick={onEditClick}
        onSaveClick={onSaveClick}
        onCancelClick={onCancelClick}
      />
    </div>
  );
};