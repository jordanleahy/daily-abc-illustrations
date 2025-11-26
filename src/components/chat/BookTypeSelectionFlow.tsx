import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BOOK_TYPE_IDS, getBookTypeDisplayName, BookTypeId } from '@/types/bookType';
import { CharacterThemeValue, getThemeDisplayName } from '@/types/characterTheme';
import { characterThemes } from '@/config/characterThemes';
import { cn } from '@/lib/utils';
import { Sparkles, ChevronRight, Check } from 'lucide-react';

interface BookTypeSelectionFlowProps {
  onComplete: (bookType: BookTypeId, characterTheme: CharacterThemeValue) => void;
  kidAge?: { years: number; months: number };
}

const BOOK_TYPE_IMAGES: Record<string, string> = {
  'abc': '/book-types/abc-book.png',
  'numbers': '/book-types/numbers-book.png',
  'shapes': '/book-types/shapes-book.png',
  'colors': '/book-types/colors-book.png',
  'rhyming': '/book-types/rhyming-book.png',
  'opposites': '/book-types/opposites-book.png',
  'emotions': '/book-types/emotions-book.png',
  'animals': '/book-types/animals-book.png',
  'first-words': '/book-types/first-words-book.png',
  'bedtime': '/book-types/bedtime-book.png',
  'cvc': '/book-types/cvc-book.png',
  'sight-words': '/book-types/sight-words-book.png',
};

export const BookTypeSelectionFlow = ({ onComplete, kidAge }: BookTypeSelectionFlowProps) => {
  const [step, setStep] = useState<'book-type' | 'character-theme'>('book-type');
  const [selectedBookType, setSelectedBookType] = useState<BookTypeId | null>(null);
  const [selectedCharacterTheme, setSelectedCharacterTheme] = useState<CharacterThemeValue | null>(null);

  const handleBookTypeSelect = (bookType: BookTypeId) => {
    setSelectedBookType(bookType);
    setStep('character-theme');
  };

  const handleCharacterThemeSelect = (theme: CharacterThemeValue) => {
    setSelectedCharacterTheme(theme);
  };

  const handleComplete = () => {
    if (selectedBookType && selectedCharacterTheme) {
      onComplete(selectedBookType, selectedCharacterTheme);
    }
  };

  const availableThemes = Object.entries(characterThemes);

  if (step === 'book-type') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
        <div className="mb-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            What would you like to create?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Choose a book type to start creating your educational content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
          {BOOK_TYPE_IDS.filter(id => id !== 'other').map((bookTypeId) => (
            <button
              key={bookTypeId}
              onClick={() => handleBookTypeSelect(bookTypeId)}
              className={cn(
                "group relative aspect-[4/3] rounded-2xl overflow-hidden",
                "bg-gradient-to-br from-accent/50 to-accent/30",
                "border-2 border-border hover:border-primary",
                "transition-all duration-300 hover:scale-105 hover:shadow-xl",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full h-full flex items-center justify-center mb-4">
                  {BOOK_TYPE_IMAGES[bookTypeId] ? (
                    <img 
                      src={BOOK_TYPE_IMAGES[bookTypeId]} 
                      alt={getBookTypeDisplayName(bookTypeId)}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-6xl opacity-50">📚</div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {getBookTypeDisplayName(bookTypeId)} Book
                </h3>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Character theme selection
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
      <div className="mb-8 text-center space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep('book-type')}
          className="mb-4"
        >
          ← Back to book types
        </Button>
        <h1 className="text-4xl font-bold text-foreground">
          Choose a character theme
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Select a theme for your {selectedBookType && getBookTypeDisplayName(selectedBookType)} book
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mb-8">
        {availableThemes.map(([themeId, theme]) => (
          <button
            key={themeId}
            onClick={() => handleCharacterThemeSelect(themeId as CharacterThemeValue)}
            className={cn(
              "group relative aspect-square rounded-xl overflow-hidden",
              "border-2 transition-all duration-300",
              selectedCharacterTheme === themeId
                ? "border-primary ring-2 ring-primary ring-offset-2 scale-105"
                : "border-border hover:border-primary hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            <img 
              src={theme.thumbnail}
              alt={theme.altText}
              className="w-full h-full object-cover"
            />
            {selectedCharacterTheme === themeId && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2">
              <p className="text-xs font-medium text-foreground text-center">
                {getThemeDisplayName(themeId)}
              </p>
            </div>
          </button>
        ))}

        {/* Custom Theme Button */}
        <button
          onClick={() => handleCharacterThemeSelect('custom')}
          className={cn(
            "group relative aspect-square rounded-xl overflow-hidden",
            "border-2 border-dashed transition-all duration-300",
            "bg-accent/30 hover:bg-accent/50",
            selectedCharacterTheme === 'custom'
              ? "border-primary ring-2 ring-primary ring-offset-2 scale-105"
              : "border-border hover:border-primary hover:scale-105",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="text-4xl mb-2">✏️</div>
            <p className="text-sm font-medium text-foreground text-center">
              Custom Theme
            </p>
          </div>
          {selectedCharacterTheme === 'custom' && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
          )}
        </button>

        {/* No Theme Button */}
        <button
          onClick={() => handleCharacterThemeSelect('no-theme')}
          className={cn(
            "group relative aspect-square rounded-xl overflow-hidden",
            "border-2 border-dashed transition-all duration-300",
            "bg-muted hover:bg-muted/80",
            selectedCharacterTheme === 'no-theme'
              ? "border-primary ring-2 ring-primary ring-offset-2 scale-105"
              : "border-border hover:border-primary hover:scale-105",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="text-4xl mb-2">📖</div>
            <p className="text-sm font-medium text-foreground text-center">
              Classic Style
            </p>
          </div>
          {selectedCharacterTheme === 'no-theme' && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
          )}
        </button>
      </div>

      {selectedCharacterTheme && (
        <Button
          size="lg"
          onClick={handleComplete}
          className="min-w-[200px]"
        >
          Start Creating
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
