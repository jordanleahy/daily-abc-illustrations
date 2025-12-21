import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { SelectableCharacter } from '@/hooks/useCharacters';

// Re-export for backward compatibility
export type { SelectableCharacter };

interface CharacterSelectorProps {
  characters: SelectableCharacter[];
  themeId: string;
  onConfirm: (selectedIds: string[]) => void;
}

export const CharacterSelector = ({ characters, themeId, onConfirm }: CharacterSelectorProps) => {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const defaults = new Set<string>();
    characters.forEach(c => {
      if (c.defaultSelected) defaults.add(c.id);
    });
    return defaults;
  });

  const toggleCharacter = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm(Array.from(selected));
  };

  return (
    <div className="space-y-4 p-3 bg-muted/30 rounded-lg border">
      <p className="text-sm font-medium text-foreground">
        Which characters should appear in your book?
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {characters.map((character) => {
          const isSelected = selected.has(character.id);
          
          return (
            <div
              key={character.id}
              role="button"
              tabIndex={0}
              onClick={() => toggleCharacter(character.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCharacter(character.id);
                }
              }}
              className={cn(
                "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer",
                "hover:border-primary/50 hover:bg-accent/30",
                isSelected 
                  ? "border-primary bg-primary/10" 
                  : "border-border bg-background"
              )}
            >
              {/* Checkbox indicator */}
              <div className="absolute top-2 right-2">
                <Checkbox 
                  checked={isSelected} 
                  className="pointer-events-none"
                />
              </div>
              
              {/* Character thumbnail or placeholder */}
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2",
                "bg-gradient-to-br from-primary/20 to-secondary/20"
              )}>
                {character.thumbnail ? (
                  <img 
                    src={character.thumbnail} 
                    alt={character.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={cn(
                  "text-xl font-bold text-primary",
                  character.thumbnail ? "hidden" : ""
                )}>
                  {character.name.charAt(0)}
                </span>
              </div>
              
              {/* Character info */}
              <span className="font-medium text-sm text-foreground">
                {character.name}
              </span>
              <span className="text-xs text-muted-foreground text-center line-clamp-2 mt-1">
                {character.description}
              </span>
            </div>
          );
        })}
      </div>
      
      <Button 
        onClick={handleConfirm}
        disabled={selected.size === 0}
        className="w-full"
        size="sm"
      >
        Confirm Selection ({selected.size} character{selected.size !== 1 ? 's' : ''})
      </Button>
      
      {selected.size === 0 && (
        <p className="text-xs text-destructive text-center">
          Please select at least one character
        </p>
      )}
    </div>
  );
};
