import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Book, Trash2, Image as ImageIcon } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { useGoogleChat } from '@/hooks/useGoogleChat';
import { useGoogleCreateBook } from '@/hooks/useGoogleCreateBook';
import { toast } from 'sonner';

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
      className="flex flex-col h-screen"
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden">
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
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-md mx-auto">
              <Sparkles className="h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Example: "I want to create a children's book about space exploration"
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {typeof msg.content === 'string' ? msg.content : 'Image uploaded'}
                    </p>
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

        {/* Input Area */}
        <div className="border-t bg-background px-4 py-4">
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
