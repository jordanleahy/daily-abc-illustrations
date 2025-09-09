import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InlineEditInputProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  isEditing?: boolean;
  renderDisplay?: (value: string) => React.ReactNode;
}

export const InlineEditInput = ({ 
  value, 
  onSave, 
  className, 
  placeholder,
  isEditing = false,
  renderDisplay 
}: InlineEditInputProps) => {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue);
    }
    if (e.key === 'Escape') {
      setEditValue(value);
    }
  };

  const handleBlur = () => {
    onSave(editValue);
  };

  if (!isEditing) {
    return renderDisplay ? renderDisplay(value) : (
      <span className={className}>{value}</span>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("min-h-0", className)}
    />
  );
};