import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface LetterCaseSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Letter Case Selector Component
 * For ABC books - selects letter case preference
 */
export const LetterCaseSelector = ({ 
  value, 
  onValueChange, 
  label = "Letter Case",
  placeholder = "Select letter case..."
}: LetterCaseSelectorProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="letter-case-selector" className="text-sm">
          {label}
        </Label>
      )}
      <Select value={value || ''} onValueChange={onValueChange}>
        <SelectTrigger id="letter-case-selector" className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Not specified</SelectItem>
          <SelectItem value="lowercase">Lowercase</SelectItem>
          <SelectItem value="uppercase">Uppercase</SelectItem>
          <SelectItem value="both">Both</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
