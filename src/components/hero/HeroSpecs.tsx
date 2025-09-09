import { Button } from '@/components/ui/button';
import { Download, Edit } from 'lucide-react';
import { HeroActions } from './HeroActions';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { format } from 'date-fns';

interface HeroSpecsProps {
  title: string;
  price: string;
  downloadUrl: string;
  publishedDate: string;
  grade: string;
  subjects: string[];
  tags: string[];
  isEditing?: boolean;
  hasChanges?: boolean;
  onEditClick?: () => void;
  onSaveClick?: () => void;
  onCancelClick?: () => void;
  onUpdateField?: (field: string, value: any) => void;
  onUpdateArrayField?: (field: 'subjects' | 'tags', value: string) => void;
}

export const HeroSpecs = ({ 
  title, 
  price, 
  downloadUrl, 
  publishedDate, 
  grade, 
  subjects, 
  tags,
  isEditing = false,
  hasChanges = false,
  onEditClick,
  onSaveClick,
  onCancelClick,
  onUpdateField,
  onUpdateArrayField
}: HeroSpecsProps) => {
  const formattedDate = format(new Date(publishedDate), 'MMMM d, yyyy');
  return (
    <div className="space-y-4 text-sm">
      <div className="mb-4 md:mb-6">
        <InlineEditInput
          value={title}
          onSave={(value) => onUpdateField?.('title', value)}
          isEditing={isEditing}
          renderDisplay={(value) => (
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{value}</h1>
          )}
          className="text-2xl md:text-3xl font-bold text-foreground mb-2 w-full border-none p-0 focus-visible:ring-0"
        />
        <InlineEditInput
          value={price}
          onSave={(value) => onUpdateField?.('price', value)}
          isEditing={isEditing}
          renderDisplay={(value) => (
            <p className="text-xl md:text-2xl font-bold text-foreground mb-2">{value}</p>
          )}
          className="text-xl md:text-2xl font-bold text-foreground mb-2 w-full border-none p-0 focus-visible:ring-0"
        />
        <p className="text-sm text-muted-foreground mb-4">Published {formattedDate}</p>
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
      
      <div>
        <h3 className="font-semibold text-muted-foreground mb-2">SPECS</h3>
        <div className="h-1 w-12 bg-emerald-500 rounded"></div>
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">AGE</h4>
        <InlineEditInput
          value={grade}
          onSave={(value) => onUpdateField?.('grade', value)}
          isEditing={isEditing}
          renderDisplay={(value) => (
            <p className="text-muted-foreground">{value}</p>
          )}
          className="text-muted-foreground w-full border-none p-0 focus-visible:ring-1"
        />
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">SUBJECT</h4>
        <InlineEditInput
          value={subjects.join(', ')}
          onSave={(value) => onUpdateArrayField?.('subjects', value)}
          isEditing={isEditing}
          renderDisplay={(value) => (
            <p className="text-muted-foreground">{value}</p>
          )}
          className="text-muted-foreground w-full border-none p-0 focus-visible:ring-1"
          placeholder="Enter subjects separated by commas"
        />
      </div>
      
      <div>
        <h4 className="font-semibold text-foreground mb-1">CHARACTERS</h4>
        <InlineEditInput
          value={tags.join(', ')}
          onSave={(value) => onUpdateArrayField?.('tags', value)}
          isEditing={isEditing}
          renderDisplay={(value) => (
            <p className="text-muted-foreground">{value}</p>
          )}
          className="text-muted-foreground w-full border-none p-0 focus-visible:ring-1"
          placeholder="Enter tags separated by commas"
        />
      </div>
    </div>
  );
};