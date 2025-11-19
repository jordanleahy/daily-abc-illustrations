import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2, Check } from 'lucide-react';

interface MetadataTextInputProps {
  label: string;
  value?: string | number;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
}

/**
 * Metadata Text Input Component
 * Debounced text input for metadata fields with save indicators
 */
export const MetadataTextInput = ({ 
  label, 
  value, 
  onSave, 
  placeholder,
  type = 'text',
  className
}: MetadataTextInputProps) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const debouncedValue = useDebounce(localValue, 500);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  // Save when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value?.toString() && debouncedValue !== '') {
      setIsSaving(true);
      onSave(debouncedValue);
      
      // Show checkmark briefly
      setTimeout(() => {
        setIsSaving(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }, 300);
    }
  }, [debouncedValue, value, onSave]);

  return (
    <div className="space-y-2">
      <Label htmlFor={`metadata-${label}`} className="text-sm">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={`metadata-${label}`}
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className={`h-9 pr-8 ${className}`}
        />
        {isSaving && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {justSaved && !isSaving && (
          <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>
    </div>
  );
};
