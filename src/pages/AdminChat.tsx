import { useState, useRef, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AdminOnly } from '@/components/AdminOnly';
import { MessageList } from '@/components/chat/MessageList';
import { useAdminChat, type Message } from '@/hooks/useAdminChat';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminChat() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch all sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-chat-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('admin_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Load messages for current session
  const { data: messages = [] } = useQuery({
    queryKey: ['admin-session-messages', currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return [];
      const session = sessions.find(s => s.id === currentSessionId);
      if (!session?.messages) return [];
      // Safely parse messages from JSONB through unknown
      return Array.isArray(session.messages) ? (session.messages as unknown as Message[]) : [];
    },
    enabled: !!currentSessionId && sessions.length > 0,
  });

  // Debounce message updates to avoid excessive database writes
  const handleMessagesUpdate = useCallback((messages: Message[], sessionId: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('admin_chat_sessions')
          .update({ 
            messages: messages as any,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        // Invalidate sessions query to refresh list
        queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
      } catch (error) {
        console.error('Failed to update session:', error);
      }
    }, 1000);
  }, [queryClient]);

  const { isLoading, sendMessage } = useAdminChat(
    currentSessionId || undefined,
    handleMessagesUpdate
  );

  // Create initial session on mount if none exists
  useEffect(() => {
    if (sessionsLoading || !user?.id) return;
    
    if (sessions.length === 0) {
      handleCreateNewSession();
    } else if (!currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessionsLoading, sessions, currentSessionId, user?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleCreateNewSession = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_chat_sessions')
        .insert({
          user_id: user.id,
          session_name: `Marketing Chat ${new Date().toLocaleDateString()}`,
          messages: [],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCurrentSessionId(data.id);
      queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
      toast.success('New chat session created');
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create new session');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSessionId) return;
    
    const messageText = input.trim();
    setInput('');
    
    await sendMessage(messageText, messages);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AdminOnly>
      <PageLayout title="Marketing Intelligence">
        <div className="flex h-[calc(100vh-12rem)] gap-4">
          {/* Sidebar with sessions */}
          <div className="w-64 border-r border-border pr-4 overflow-y-auto hidden md:block">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Chat Sessions</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCreateNewSession}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {session.session_name || 'Untitled Chat'}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <h3 className="text-xl font-semibold mb-2">Marketing Intelligence Assistant</h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask me for marketing ideas, content strategies, or growth tactics. 
                    I'll provide small, actionable steps you can implement today.
                  </p>
                </div>
              ) : (
                <MessageList messages={messages} />
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border pt-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about marketing strategies, content ideas, growth tactics..."
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-[60px] shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </AdminOnly>
  );
}
