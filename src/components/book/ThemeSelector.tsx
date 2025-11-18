import { CharacterTheme, themeDisplayNames, CharacterThemeValue } from '@/types/characterTheme';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ThemeSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Theme Selector Component
 * Provides a dropdown for selecting standardized character themes
 * Enforces enum values to prevent invalid theme names
 */
export const ThemeSelector = ({ 
  value, 
  onValueChange, 
  label = "Character Theme",
  placeholder = "Select a theme...",
  required = false
}: ThemeSelectorProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="theme-selector">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value || ''} onValueChange={onValueChange}>
        <SelectTrigger id="theme-selector">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No Theme</SelectItem>
          {Object.entries(themeDisplayNames).map(([themeValue, displayName]) => (
            <SelectItem key={themeValue} value={themeValue}>
              {displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
