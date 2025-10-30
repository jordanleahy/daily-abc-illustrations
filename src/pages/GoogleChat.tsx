import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Book, Trash2, Image as ImageIcon } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { useGoogleChat, type SuggestedAction } from '@/hooks/useGoogleChat';
import { useGoogleCreateBook } from '@/hooks/useGoogleCreateBook';
import { toast } from 'sonner';
import { BOOK_TYPES } from '@/config/bookTypes';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GoogleChat() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, sendMessageWithImage, clearMessages } = useGoogleChat();
  const createBookMutation = useGoogleCreateBook();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const message = input.trim() || 'What do you think of this style for inspiration?';
      setInput('');
      setShowImageUpload(false);
      await sendMessageWithImage(message, base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleBookTypeSelect = async (bookType: typeof BOOK_TYPES[0]) => {
    if (bookType.needsClarification && bookType.clarificationContext) {
      // Send clarification request to AI
      const clarificationPrompt = `${bookType.prompt}\n\n[CLARIFICATION_NEEDED: ${bookType.clarificationContext}]`;
      await sendMessage(clarificationPrompt);
    } else {
      // Send direct prompt
      await sendMessage(bookType.prompt);
    }
  };

  const handleQuickReply = async (action: SuggestedAction) => {
    if (action.value) {
      // Send the predefined response
      await sendMessage(action.value);
    } else {
      // "Custom" option - just focus the input field
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  };

  const handleCreateBook = async () => {
    if (messages.length === 0) {
      toast.error('Please have a conversation first');
      return;
    }

    // Convert messages to simple text format for book creation
    const textMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : 'Image uploaded'
    }));

    const result = await createBookMutation.mutateAsync({
      conversationHistory: textMessages
    });

    if (result.success && result.bookId) {
      navigate(`/editor/${result.bookId}`);
    }
  };

  return (
    <PageLayout 
      title="Chat with Google Gemini"
      showHeader={true}
      fullHeight={true}
    >
      <div className="fixed inset-0 top-[3.5rem] flex flex-col">
        {/* Header */}
        <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Google Gemini Chat</h2>
              <p className="text-xs text-muted-foreground">
                Discuss your book ideas with AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <Button 
                  onClick={clearMessages} 
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  onClick={handleCreateBook}
                  disabled={createBookMutation.isPending || isLoading}
                  size="sm"
                >
                  <Book className="mr-2 h-4 w-4" />
                  {createBookMutation.isPending ? 'Creating...' : 'Generate Book'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-6">
              <div className="max-w-4xl w-full space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h2 className="text-2xl font-bold">What would you like to create?</h2>
                  <p className="text-muted-foreground">
                    Choose a book type below or describe your own custom idea
                  </p>
                </div>

                {/* Book Type Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <TooltipProvider>
                    {BOOK_TYPES.map((bookType) => {
                      const IconComponent = bookType.icon;
                      return (
                        <Tooltip key={bookType.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handleBookTypeSelect(bookType)}
                              disabled={isLoading}
                              className="h-auto flex flex-col items-center gap-3 p-4 hover:bg-accent hover:scale-105 transition-all"
                            >
                              <IconComponent className={`h-8 w-8 ${bookType.color}`} />
                              <span className="text-sm font-medium text-center leading-tight">
                                {bookType.label}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{bookType.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or describe your own idea
                    </span>
                  </div>
                </div>

                {/* Example prompt */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Example: "Create an ABC book about dinosaurs" or "Numbers book with space theme"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg, idx) => (
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
                                return (
                                  <div key={i} className="flex gap-3 p-3 rounded-md bg-background/50 border border-border/50 hover:border-primary/50 transition-colors">
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
                              onClick={() => handleQuickReply(action)}
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
              ))}
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
          )}
        </div>

        {/* Image Upload Area */}
        {showImageUpload && (
          <div className="border-t px-4 py-3 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Upload inspiration image</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowImageUpload(false)}
                >
                  Cancel
                </Button>
              </div>
              <ImageUpload 
                onImageSelect={handleImageSelect}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Input Area - Fixed Footer */}
        <div className="border-t bg-background px-4 py-4 shrink-0">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={showImageUpload ? "Optional: Add a message with your image..." : "Type your message..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => setShowImageUpload(!showImageUpload)} 
              variant="outline"
              size="icon"
              disabled={isLoading}
              title="Upload inspiration image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

    </PageLayout>
  );
}
