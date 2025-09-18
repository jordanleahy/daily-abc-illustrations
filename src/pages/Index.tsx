import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useDailyPublished } from '@/hooks/useDailyPublished';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const Index = () => {
  const { session, isAuthenticated, loading } = useAuth();
  const { data: dailyContent, isLoading: isDailyLoading } = useDailyPublished();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [bookCreated, setBookCreated] = useState<{ id: string; message: string } | null>(null);
  
  // Refs for auto-scroll functionality
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (!userScrolledUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, userScrolledUp]);

  // Reset scroll tracking when new messages are added
  useEffect(() => {
    setUserScrolledUp(false);
  }, [messages.length]);

  // Removed automatic redirect to daily publication - users can navigate manually if needed
  // useEffect(() => {
  //   if (!loading && !isDailyLoading && dailyContent && dailyContent.id) {
  //     navigate(`/daily-published/${dailyContent.id}`, { replace: true });
  //   }
  // }, [dailyContent, loading, isDailyLoading, navigate]);

  // Handle scroll events to detect if user scrolled up
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isScrolledToBottom = 
      Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 10;
    
    setUserScrolledUp(!isScrolledToBottom);
  };

  // Show loading state while checking authentication or daily content
  if (loading || isDailyLoading) {
    return (
      <PageLayout title="ABC Cards" showHeader={true} fullHeight={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <PageLayout title="ABC Cards Chat" showHeader={true} fullHeight={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please sign in to chat with your ABC Cards agent. You can sign in using the profile button in the top navigation.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

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
      // Get the access token for authentication
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await supabase.functions.invoke('chat', {
        body: { 
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (response.error) {
        // Extract the actual error message from the edge function response
        const errorMessage = response.data?.error || response.error.message || response.error;
        throw new Error(errorMessage);
      }

      const data = response.data;
      
      if (data.response) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        // Automatic book creation removed - use manual button instead
      } else if (data.content) {
        // Handle legacy response format
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response received from assistant');
      }
    } catch (error) {
      console.error('Chat error:', error);
      let errorContent = 'Sorry, there was an error processing your request.';
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('No agent configuration found')) {
          errorContent = 'Please configure your ABC Cards agent first by visiting the Agents page.';
        } else if (error.message.includes('token')) {
          errorContent = 'Authentication error. Please try signing out and back in.';
        } else if (error.message.includes('OpenAI returned empty response content')) {
          errorContent = 'The AI model hit its token limit and returned no content. Try asking a shorter question or configure a higher token limit in your agent settings.';
        } else if (error.message.includes('OpenAI API error')) {
          errorContent = `OpenAI API error: ${error.message}`;
        } else {
          // Show the actual error message for any other errors
          errorContent = error.message;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBook = async () => {
    if (!session?.access_token || messages.length === 0 || isCreatingBook) return;

    setIsCreatingBook(true);
    
    try {
      const response = await supabase.functions.invoke('create-book', {
        body: { 
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userId: session.user.id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (response.error) {
        throw new Error(response.data?.error || response.error.message);
      }

      const data = response.data;
      
      if (data.success) {
        setBookCreated({
          id: data.bookId,
          message: data.message || 'Your book has been created!'
        });
        toast.success('Book created successfully!');
      } else {
        throw new Error(data.error || 'Failed to create book');
      }
    } catch (error) {
      console.error('Book creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create book');
    } finally {
      setIsCreatingBook(false);
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
          <ScrollArea className="flex-1" onScrollCapture={handleScroll}>
            <div className="space-y-4 px-2 pb-4" ref={scrollAreaRef}>
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
              
              {/* Book Created Notification */}
              {bookCreated && (
                <div className="flex justify-center">
                  <Card className="max-w-md bg-primary/10 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">{bookCreated.message}</p>
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/books/${bookCreated.id}`)}
                            className="flex items-center gap-1"
                          >
                            View Book <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Book Creation Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleCreateBook}
                disabled={messages.length === 0 || isCreatingBook || isLoading}
                variant="outline"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {isCreatingBook ? 'Creating Book...' : 'Give to Book Creation Agent'}
              </Button>
            </div>
            
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
