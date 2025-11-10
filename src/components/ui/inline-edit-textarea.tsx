import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface InlineEditTextareaProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  isEditing?: boolean;
  renderDisplay?: (value: string) => React.ReactNode;
}

export const InlineEditTextarea = ({ 
  value, 
  onSave, 
  className, 
  placeholder,
  isEditing: externalIsEditing,
  renderDisplay 
}: InlineEditTextareaProps) => {
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(externalIsEditing || false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (externalIsEditing !== undefined) {
      setIsEditing(externalIsEditing);
    }
  }, [externalIsEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(value);
      setIsEditing(false);
    }
    // Allow Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission or new line
      onSave(editValue);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    onSave(editValue);
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
    <Textarea
      ref={textareaRef}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("min-h-[80px] resize-none", className)}
    />
  );
};