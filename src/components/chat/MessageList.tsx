import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { Message as ChatMessage } from '@/hooks/useGoogleChat';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onQuickReply: (action: any) => void;
}

export const MessageList = memo(function MessageList({ 
  messages, 
  isLoading, 
  onQuickReply 
}: MessageListProps) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {messages.map((msg, idx) => {
        // Filter out system messages
        if (msg.role === 'system') return null;
        
        return (
        <div
          key={idx}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className="max-w-[80%] space-y-2">
            <div
              className={`rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.role === 'assistant' && typeof msg.content === 'string' && /^\d+\./.test(msg.content) ? (
                // Enhanced formatting for numbered lists (page ideas)
                <div className="space-y-3">
                  {msg.content
                    .replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '')
                    .trim()
                    .split(/\n(?=\d+\.)/)
                    .map((item, i) => {
                      const match = item.match(/^(\d+)\.\s+(.+)/s);
                      if (match) {
                        const [, number, content] = match;
                        // Check if content has bold markers (**text**)
                        const parts = content.split(/(\*\*.*?\*\*)/g);
                        
                        const handleCopyPage = () => {
                          navigator.clipboard.writeText(content.trim());
                          toast.success(`Page ${number} description copied to clipboard`);
                        };
                        
                        return (
                          <div key={i} className="relative flex gap-3 p-3 rounded-md bg-background/50 border border-border/50 hover:border-primary/50 transition-colors group">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                              {number}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p className="text-sm leading-relaxed">
                                {parts.map((part, j) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <span key={j} className="font-semibold text-foreground">
                                        {part.slice(2, -2)}
                                      </span>
                                    );
                                  }
                                  return <span key={j}>{part}</span>;
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCopyPage}
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      }
                      return (
                        <p key={i} className="text-sm whitespace-pre-wrap">
                          {item.trim()}
                        </p>
                      );
                    })}
                </div>
              ) : (
                // Regular text content
                <p className="text-sm whitespace-pre-wrap">
                  {typeof msg.content === 'string' 
                    ? msg.content.replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '').trim()
                    : 'Image uploaded'
                  }
                </p>
              )}
            </div>
            
            {/* Quick Reply Buttons */}
            {msg.role === 'assistant' && msg.suggestedActions && idx === messages.length - 1 && !isLoading && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground px-1">
                  Quick options (or type your own below):
                </p>
                <div className="flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickReply(action)}
                      className="text-xs h-8"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )})}
      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
            <p className="text-sm text-muted-foreground animate-pulse">
              Google Gemini is thinking...
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
