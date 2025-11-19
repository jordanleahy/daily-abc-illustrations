import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AnimalCategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Animal Category Selector Component
 * For animal books - selects animal category
 */
export const AnimalCategorySelector = ({ 
  value, 
  onValueChange, 
  label = "Animal Category",
  placeholder = "Select category..."
}: AnimalCategorySelectorProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="animal-category-selector" className="text-sm">
          {label}
        </Label>
      )}
      <Select value={value || ''} onValueChange={onValueChange}>
        <SelectTrigger id="animal-category-selector" className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="farm">Farm Animals</SelectItem>
          <SelectItem value="zoo">Zoo Animals</SelectItem>
          <SelectItem value="ocean">Ocean Animals</SelectItem>
          <SelectItem value="pets">Pets</SelectItem>
          <SelectItem value="mixed">Mixed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
