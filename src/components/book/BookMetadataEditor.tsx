import { BookMetadata } from '@/types/book';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useUpdateBookMetadata } from '@/hooks/useUpdateBookMetadata';
import { BookTypeSelector } from './BookTypeSelector';
import { AgeRangeSelector } from './AgeRangeSelector';
import { ThemeSelector } from './ThemeSelector';
import { LetterCaseSelector } from './LetterCaseSelector';
import { AnimalCategorySelector } from './AnimalCategorySelector';
import { MetadataTextInput } from './MetadataTextInput';

interface BookMetadataEditorProps {
  bookId: string;
  currentMetadata: BookMetadata;
  className?: string;
}

/**
 * Book Metadata Editor Component
 * Comprehensive inline editor for all book metadata fields
 * Conditional rendering based on book type
 */
export const BookMetadataEditor = ({ 
  bookId, 
  currentMetadata, 
  className 
}: BookMetadataEditorProps) => {
  const { mutate: updateMetadata } = useUpdateBookMetadata(bookId);

  return (
    <div className={cn("space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Edit Metadata</h4>
        <Badge variant="outline" className="text-xs">Admin Only</Badge>
      </div>
      
      {/* Universal Fields Grid - Always Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BookTypeSelector 
          value={currentMetadata.bookType}
          onValueChange={(value) => updateMetadata({ updates: { bookType: value as any } })}
        />
        <AgeRangeSelector 
          value={currentMetadata.targetAge}
          onValueChange={(value) => updateMetadata({ updates: { targetAge: value as any } })}
        />
        <ThemeSelector 
          value={currentMetadata.characterTheme}
          onValueChange={(value) => updateMetadata({ updates: { characterTheme: value as any } })}
        />
        <MetadataTextInput
          label="Page Count"
          type="number"
          value={currentMetadata.pageCount}
          onSave={(value) => updateMetadata({ updates: { pageCount: parseInt(value) || undefined } })}
          placeholder="e.g., 26"
        />
      </div>
      
      {/* Conditional Fields Based on Book Type */}
      {currentMetadata.bookType === 'abc' && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">ABC Book Settings</Label>
          <LetterCaseSelector 
            value={currentMetadata.letterCase}
            onValueChange={(value) => updateMetadata({ updates: { letterCase: value as any } })}
          />
        </div>
      )}
      
      {currentMetadata.bookType === 'numbers' && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">Numbers Book Settings</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <MetadataTextInput
              label="Number Range"
              placeholder="e.g., 1-10"
              value={currentMetadata.numberRange}
              onSave={(value) => updateMetadata({ updates: { numberRange: value } })}
            />
            <MetadataTextInput
              label="Counting Style"
              placeholder="e.g., simple"
              value={currentMetadata.countingStyle}
              onSave={(value) => updateMetadata({ updates: { countingStyle: value } })}
            />
          </div>
        </div>
      )}
      
      {currentMetadata.bookType === 'shapes' && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">Shapes Book Settings</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <MetadataTextInput
              label="Complexity"
              placeholder="e.g., basic"
              value={currentMetadata.shapeComplexity}
              onSave={(value) => updateMetadata({ updates: { shapeComplexity: value } })}
            />
            <MetadataTextInput
              label="Theme"
              placeholder="e.g., nature"
              value={currentMetadata.shapeTheme}
              onSave={(value) => updateMetadata({ updates: { shapeTheme: value } })}
            />
          </div>
        </div>
      )}
      
      {currentMetadata.bookType === 'animals' && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">Animals Book Settings</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AnimalCategorySelector 
              value={currentMetadata.animalCategory}
              onValueChange={(value) => updateMetadata({ updates: { animalCategory: value } })}
            />
            <MetadataTextInput
              label="Focus"
              placeholder="e.g., sounds, habitats"
              value={currentMetadata.animalFocus}
              onSave={(value) => updateMetadata({ updates: { animalFocus: value } })}
            />
          </div>
        </div>
      )}
      
      {currentMetadata.bookType === 'sight-words' && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="text-xs text-muted-foreground">Sight Words Settings</Label>
          <MetadataTextInput
            label="Reading Level"
            placeholder="e.g., Pre-K"
            value={currentMetadata.readingLevel}
            onSave={(value) => updateMetadata({ updates: { readingLevel: value } })}
          />
        </div>
      )}
    </div>
  );
};
