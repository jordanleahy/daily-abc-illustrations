import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('chat', {
        body: { 
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.content || 'Sorry, I could not generate a response.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="ABC Cards Chat" showHeader={true} fullHeight={false}>
      <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 pb-24">
          
          {/* Header */}
          <div className="text-center py-6 border-b border-border mb-4">
            <h1 className="text-2xl font-semibold text-foreground">ABC Agent Assistant</h1>
            <p className="text-sm text-muted-foreground mt-1">Ask me anything!</p>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 px-2 pb-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Start a conversation by typing a message below</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'bg-muted text-foreground mr-12'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-lg px-4 py-3 mr-12">
                    <div className="text-sm font-medium mb-1">Assistant</div>
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150"></div>
                      </div>
                      <span className="text-xs ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="resize-none pr-12 min-h-[50px] max-h-32"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
