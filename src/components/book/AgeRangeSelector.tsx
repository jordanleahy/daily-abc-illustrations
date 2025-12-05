import { useAgeGroups } from '@/hooks/useAgeGroups';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
 * Fetches age groups from centralized database table
 */
export const AgeRangeSelector = ({ 
  value, 
  onValueChange, 
  label = "Target Age",
  placeholder = "Select age range...",
  required = false
}: AgeRangeSelectorProps) => {
  const { data: ageGroups, isLoading } = useAgeGroups();

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="age-range-selector" className="text-sm">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value || ''} onValueChange={onValueChange} disabled={isLoading}>
        <SelectTrigger id="age-range-selector" className="h-9">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {ageGroups?.map((ageGroup) => (
            <SelectItem key={ageGroup.id} value={ageGroup.id}>
              {ageGroup.label}
            </SelectItem>
          ))}
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
