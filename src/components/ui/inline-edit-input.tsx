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
  isEditing: externalIsEditing,
  renderDisplay 
}: InlineEditInputProps) => {
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(externalIsEditing || false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (externalIsEditing !== undefined) {
      setIsEditing(externalIsEditing);
    }
  }, [externalIsEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      // Wait for save to complete before closing
      await Promise.resolve(onSave(editValue));
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = async () => {
    // Wait for save to complete before closing
    await Promise.resolve(onSave(editValue));
    setIsEditing(false);
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  if (!isEditing) {
    return (
      <div onClick={handleClick} className="cursor-pointer">
        {renderDisplay ? renderDisplay(value) : (
          <span className={className}>{value}</span>
        )}
      </div>
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