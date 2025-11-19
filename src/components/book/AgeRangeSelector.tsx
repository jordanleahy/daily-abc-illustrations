import { AGE_RANGE_IDS, getAgeRangeDisplayName, AgeRangeId } from '@/types/ageRange';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AgeRangeSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Age Range Selector Component
 * Provides a dropdown for selecting standardized age ranges
 * Enforces enum values to prevent invalid age range names
 */
export const AgeRangeSelector = ({ 
  value, 
  onValueChange, 
  label = "Target Age",
  placeholder = "Select age range...",
  required = false
}: AgeRangeSelectorProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="age-range-selector" className="text-sm">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger id="age-range-selector" className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {AGE_RANGE_IDS.filter(id => id !== 'other').map((ageRangeId) => (
            <SelectItem key={ageRangeId} value={ageRangeId}>
              {getAgeRangeDisplayName(ageRangeId)}
            </SelectItem>
          ))}
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
