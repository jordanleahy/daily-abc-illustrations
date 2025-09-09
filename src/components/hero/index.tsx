import { HeroContent } from './HeroContent';
import { DailyContent } from './types';
import { Section } from '@/components/layout/Section';
import { useInlineEdit } from '@/hooks/useInlineEdit';

interface HeroSectionProps {
  content: DailyContent;
  onSave?: (updatedContent: DailyContent) => Promise<void>;
}

export const HeroSection = ({ content, onSave }: HeroSectionProps) => {
  const {
    isEditing,
    editedContent,
    hasChanges,
    startEdit,
    cancelEdit,
    updateField,
    updateArrayField,
    saveChanges,
  } = useInlineEdit(content);

  const handleSave = () => {
    saveChanges(onSave);
  };

  return (
    <Section id="hero" variant="hero">
      <HeroContent 
        content={editedContent}
        isEditing={isEditing}
        hasChanges={hasChanges}
        onEditClick={startEdit}
        onSaveClick={handleSave}
        onCancelClick={cancelEdit}
        onUpdateField={updateField}
        onUpdateArrayField={updateArrayField}
      />
    </Section>
  );
};

export type { DailyContent, HeroSectionProps } from './types';