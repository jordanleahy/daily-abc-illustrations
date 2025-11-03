import { memo } from 'react';
import { Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/hooks/useGoogleChat';
import type { SuggestedAction } from '@/hooks/useGoogleChat';
import { ImageButton } from './ImageButton';
import { characterThemes } from '@/config/characterThemes';

interface MessageItemProps {
  message: Message;
  onQuickReply?: (action: SuggestedAction) => void;
}

const slugify = (text: string): string => {
  return text
    .normalize('NFD') // split accented characters
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const MessageItem = memo(({ message, onQuickReply }: MessageItemProps) => {
  const isUser = message.role === 'user';
  
  // Strip out [CLARIFICATION_NEEDED: ...] tags that should never be shown to users
  let content = typeof message.content === 'string' ? message.content : 'Uploaded an image';
  if (typeof content === 'string') {
    content = content.replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '').trim();
  }

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
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {content}
        </p>
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {message.suggestedActions.map((action) => {
              // Try themeId first, then fallback to slugified label
let theme = action.themeId
  ? (characterThemes[action.themeId] ?? characterThemes[slugify(action.themeId)])
  : undefined;
if (!theme) {
  const slugifiedLabel = slugify(action.label);
  theme = characterThemes[slugifiedLabel];
}
              
              if (theme) {
                return (
                <ImageButton
                  key={action.id}
                  action={action}
                  imageSrc={theme.thumbnail}
                  altText={theme.altText}
                  size={80}
                  onClick={() => onQuickReply?.(action)}
                />
                );
              }
              
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickReply?.(action)}
                  className="text-xs"
                >
                  {action.label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
