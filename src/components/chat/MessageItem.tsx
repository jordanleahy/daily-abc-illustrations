import { memo } from 'react';
import { Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/hooks/useGoogleChat';
import type { SuggestedAction } from '@/hooks/useGoogleChat';
import { ImageButton } from './ImageButton';
import { characterThemes } from '@/config/characterThemes';
import { BookRecommendationCard } from './BookRecommendationCard';
import { parseRecommendations } from '@/utils/recommendationParser';
import { CharacterSelector } from './CharacterSelector';

interface MessageItemProps {
  message: Message;
  onQuickReply?: (action: SuggestedAction) => void;
  isBookCreated?: boolean;
}

const slugify = (text: string): string => {
  return text
    .normalize('NFD') // split accented characters
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const MessageItem = memo(({ message, onQuickReply, isBookCreated }: MessageItemProps) => {
  const isUser = message.role === 'user';
  
  // Strip out internal tags that should never be shown to users
  let content = typeof message.content === 'string' ? message.content : 'Uploaded an image';
  if (typeof content === 'string') {
    content = content
      .replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '')
      .replace(/\[INTAKE_COMPLETE\]/g, '')
      .replace(/\[SUGGEST\][\s\S]*?\[\/SUGGEST\]/g, '')
      .trim();
  }

  // Parse book recommendations from AI responses (disabled if book already created)
  const { recommendations, remainingText } = typeof content === 'string' && !isUser && !isBookCreated
    ? parseRecommendations(content)
    : { recommendations: [], remainingText: content };

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'bg-muted/30' : 'bg-background')}>
      <div className={cn(
        'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full',
        isUser ? 'bg-primary' : 'bg-secondary'
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-secondary-foreground" />
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {remainingText && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {remainingText}
          </p>
        )}
        {recommendations.length > 0 && (
          <div className="space-y-3 mt-3">
            {recommendations.map((rec, idx) => (
              <BookRecommendationCard key={idx} title={rec.title} description={rec.description} />
            ))}
          </div>
        )}
        {message.suggestedActions && message.suggestedActions.length > 0 && (() => {
          // Check if any action has character selection data
          const characterSelectionAction = message.suggestedActions.find(a => a.characterSelection);
          
          if (characterSelectionAction?.characterSelection) {
            return (
              <CharacterSelector
                characters={characterSelectionAction.characterSelection.characters}
                themeId={characterSelectionAction.characterSelection.themeId}
                onConfirm={(selectedIds) => {
                  // Create a response action with selected characters
                  const selectedNames = characterSelectionAction.characterSelection!.characters
                    .filter(c => selectedIds.includes(c.id))
                    .map(c => c.name);
                  
                  onQuickReply?.({
                    id: 'character-selection-confirm',
                    label: `Selected: ${selectedNames.join(', ')}`,
                    value: `I want these characters in my book: ${selectedNames.join(', ')}`,
                    themeId: characterSelectionAction.characterSelection!.themeId as any,
                    selectedCharacterIds: selectedIds, // Pass selected character IDs for enforcement
                  });
                }}
              />
            );
          }
          
          // Separate actions into text and image buttons
          const textActions = [];
          const imageActions = [];
          
          for (const action of message.suggestedActions) {
            let theme = action.themeId
              ? (characterThemes[action.themeId] ?? characterThemes[slugify(action.themeId)])
              : undefined;
            if (!theme) {
              const slugifiedLabel = slugify(action.label);
              theme = characterThemes[slugifiedLabel];
            }
            
            if (theme) {
              imageActions.push({ action, theme });
            } else {
              textActions.push(action);
            }
          }
          
          return (
            <>
              {/* Image buttons - grid layout */}
              {imageActions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {imageActions.map(({ action, theme }) => (
                    <ImageButton
                      key={action.id}
                      action={action}
                      imageSrc={theme.thumbnail}
                      altText={theme.altText}
                      onClick={() => onQuickReply?.(action)}
                    />
                  ))}
                </div>
              )}
              
              {/* Text buttons - full width blocks */}
              {textActions.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {textActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickReply?.(action)}
                      className="text-xs w-full"
                    >
                      {action.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()}
                    </Button>
                  ))}
                  {/* Other button - focuses input for custom text */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Focus the input field by dispatching a custom event
                      window.dispatchEvent(new CustomEvent('focus-chat-input'));
                    }}
                    className="text-xs w-full text-muted-foreground hover:text-foreground"
                  >
                    ✏️ Other (type your own)
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
