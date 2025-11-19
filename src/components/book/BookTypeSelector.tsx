import { BOOK_TYPE_IDS, getBookTypeDisplayName, BookTypeId } from '@/types/bookType';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface BookTypeSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Book Type Selector Component
 * Provides a dropdown for selecting standardized book types
 * Enforces enum values to prevent invalid book type names
 */
export const BookTypeSelector = ({ 
  value, 
  onValueChange, 
  label = "Book Type",
  placeholder = "Select book type...",
  required = false
}: BookTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="book-type-selector" className="text-sm">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value || ''} onValueChange={onValueChange}>
        <SelectTrigger id="book-type-selector" className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {BOOK_TYPE_IDS.filter(id => id !== 'other').map((bookTypeId) => (
            <SelectItem key={bookTypeId} value={bookTypeId}>
              {getBookTypeDisplayName(bookTypeId)}
            </SelectItem>
          ))}
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
