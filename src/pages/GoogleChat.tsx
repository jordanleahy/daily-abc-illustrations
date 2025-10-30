import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Book, Trash2 } from 'lucide-react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGoogleChat } from '@/hooks/useGoogleChat';
import { useGoogleCreateBook } from '@/hooks/useGoogleCreateBook';
import { toast } from 'sonner';

export default function GoogleChat() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useGoogleChat();
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

  const handleCreateBook = async () => {
    if (messages.length === 0) {
      toast.error('Please have a conversation first');
      return;
    }

    const result = await createBookMutation.mutateAsync({
      conversationHistory: messages
    });

    if (result.success && result.bookId) {
      navigate(`/editor/${result.bookId}`);
    }
  };

  return (
    <StandardPageLayout 
      title="Google Gemini Chat"
    >
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle>Chat with Google Gemini</CardTitle>
            </div>
            <CardDescription>
              Discuss your book ideas with Google's powerful AI assistant. 
              Once ready, generate a complete book instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages Area */}
            <ScrollArea ref={scrollRef} className="h-[400px] w-full rounded-lg border bg-background p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Start a conversation about your book idea
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Example: "I want to create a children's book about space exploration"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                        <p className="text-sm text-muted-foreground animate-pulse">
                          Google Gemini is thinking...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
              {messages.length > 0 && (
                <Button 
                  onClick={clearMessages} 
                  variant="outline"
                  size="icon"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            {messages.length > 0 && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleCreateBook}
                  disabled={createBookMutation.isPending || isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Book className="mr-2 h-5 w-5" />
                  {createBookMutation.isPending ? 'Creating Book...' : 'Generate Book'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. 💬 Chat with Google Gemini about your book concept</p>
            <p>2. 🎨 Discuss themes, learning objectives, and style</p>
            <p>3. 📚 Click "Generate Book" to create your complete book</p>
            <p>4. ✏️ Review and edit your generated book in the editor</p>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
}
