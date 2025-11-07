import { memo } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '@/hooks/useGoogleChat';
import type { SuggestedAction } from '@/hooks/useGoogleChat';

interface MessageListProps {
  messages: Message[];
  onQuickReply?: (action: SuggestedAction) => void;
  isBookCreated?: boolean;
}

export const MessageList = memo(({ messages, onQuickReply, isBookCreated }: MessageListProps) => {
  // Filter out system messages
  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <div className="flex flex-col">
      {visibleMessages.map((message, index) => (
        <MessageItem
          key={index}
          message={message}
          onQuickReply={onQuickReply}
          isBookCreated={isBookCreated}
        />
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList';
