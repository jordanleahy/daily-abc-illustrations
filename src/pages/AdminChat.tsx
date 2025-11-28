import { useState, useEffect, useRef } from 'react';
import { AdminOnly } from '@/components/AdminOnly';
import { PageLayout } from '@/components/layout/PageLayout';
import { MessageList } from '@/components/chat/MessageList';
import { useAdminChat } from '@/hooks/useAdminChat';
import { useAdminChatSessions } from '@/hooks/useAdminChatSessions';
import { AdminChatSessionSidebar } from '@/components/chat/AdminChatSessionSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Send, Zap, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminChat() {
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTestingEmbeddings, setIsTestingEmbeddings] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    isLoading: sessionsLoading,
    hasMore,
    loadMore,
    createSession,
    updateSessionMessages,
    updateSessionName,
    deleteSession,
  } = useAdminChatSessions();

  const handleMessagesUpdate = async (messages: any[]) => {
    if (currentSessionId) {
      await updateSessionMessages({ sessionId: currentSessionId, messages });
    }
  };

  const { messages, isLoading, sendMessage } = useAdminChat({
    sessionId: currentSessionId,
    onMessagesUpdate: handleMessagesUpdate,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false); // Auto-close on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-create first session if none exist
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0 && !currentSessionId) {
      console.log('[AdminChat] Auto-creating first session');
      createSession().then((newSession) => {
        console.log('[AdminChat] Session created:', newSession.id);
        setCurrentSessionId(newSession.id);
      }).catch(error => {
        console.error('[AdminChat] Error creating initial session:', error);
      });
    } else if (!sessionsLoading && sessions.length > 0 && !currentSessionId) {
      // Auto-select first session if sessions exist but none selected
      console.log('[AdminChat] Auto-selecting first session:', sessions[0].id);
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessionsLoading, sessions.length, currentSessionId]);

  const handleCreateSession = async () => {
    try {
      const newSession = await createSession();
      setCurrentSessionId(newSession.id);
      if (isMobile) {
        setIsMobileSidebarOpen(false); // Close sidebar after creating on mobile
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions[0]?.id);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTestEmbeddings = async () => {
    setIsTestingEmbeddings(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-embeddings', {
        method: 'POST',
      });

      if (error) throw error;

      if (data.success) {
        toast.success('✅ Lovable AI Gateway supports embeddings!', {
          description: `Model: ${data.model}, Dimensions: ${data.dimensions}`,
          duration: 5000,
        });
      } else {
        toast.error('❌ Embeddings not supported', {
          description: data.suggestion || 'Will need OpenAI API key',
          duration: 5000,
        });
      }

      console.log('Test results:', data);
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTestingEmbeddings(false);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    try {
      const testText = 'Chairlift Habits is an educational platform for creating personalized ABC books for children.';
      
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          text: testText,
          metadata: { source: 'admin-test', timestamp: new Date().toISOString() },
          storeInDB: true,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('✅ Embedding generated and stored!', {
          description: `Dimensions: ${data.dimensions}, ID: ${data.id?.substring(0, 8)}...`,
          duration: 5000,
        });
      } else {
        toast.error('❌ Generation failed', {
          description: data.error || 'Unknown error',
          duration: 5000,
        });
      }

      console.log('Generation results:', data);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Generation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  const handleSeedEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    try {
      const contentSamples = [
        {
          text: "Chairlift Habits: Create personalized educational ABC books for children with AI-powered illustrations and character themes like Paw Patrol and Frozen",
          metadata: { type: 'product-overview', source: 'main-feature' }
        },
        {
          text: "Parent rewards system with habits tracking and coin-based rewards store for toddlers and preschoolers",
          metadata: { type: 'feature', source: 'habits-rewards' }
        },
        {
          text: "Snowboarding trick tracking app for kids with progress photos, video uploads, and goal completion milestones",
          metadata: { type: 'feature', source: 'tricks-tracking' }
        },
        {
          text: "Specialized AI agents for different book types: ABC, Numbers, Rhyming, Colors, Shapes, Emotions with type-specific educational content",
          metadata: { type: 'feature', source: 'book-creation-agents' }
        },
        {
          text: "Marketing intelligence chat interface for growth strategies and content ideas targeting parents of young children",
          metadata: { type: 'feature', source: 'admin-chat' }
        }
      ];

      let successCount = 0;
      for (const sample of contentSamples) {
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
          body: {
            text: sample.text,
            metadata: sample.metadata,
            storeInDB: true
          }
        });

        if (!error && data.success) successCount++;
      }

      toast.success(`✅ Seeded ${successCount} embeddings!`, {
        description: 'Database is ready for semantic search',
        duration: 5000,
      });
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error('Seeding failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  const handleTestSemanticSearch = async () => {
    setIsGeneratingEmbeddings(true);
    try {
      // Search for content about educational features
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          text: 'educational books for kids with illustrations',
          storeInDB: false
        }
      });

      if (embeddingError) throw embeddingError;

      if (!embeddingData.success) {
        throw new Error(embeddingData.error || 'Failed to generate query embedding');
      }

      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_embeddings', {
          query_embedding: embeddingData.embedding,
          match_threshold: 0.5,
          match_count: 5
        });

      if (searchError) throw searchError;

      toast.success('✅ Semantic search complete!', {
        description: `Found ${searchResults?.length || 0} similar items (check console for details)`,
        duration: 5000,
      });

      console.log('Search results:', searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  return (
    <AdminOnly>
      <PageLayout 
        title="Admin Chat" 
        showHeader={true} 
        fullHeight={true}
        onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
      >
        <div className="fixed inset-0 top-[3.5rem] flex bg-background">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-80">
            <AdminChatSessionSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onCreateSession={handleCreateSession}
              onSelectSession={setCurrentSessionId}
              onRenameSession={(sessionId, name) => updateSessionName({ sessionId, name })}
              onDeleteSession={handleDeleteSession}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </div>

          {/* Mobile Sidebar Sheet */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <AdminChatSessionSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onCreateSession={handleCreateSession}
                onSelectSession={(sessionId) => {
                  setCurrentSessionId(sessionId);
                  setIsMobileSidebarOpen(false);
                }}
                onRenameSession={(sessionId, name) => updateSessionName({ sessionId, name })}
                onDeleteSession={handleDeleteSession}
                hasMore={hasMore}
                onLoadMore={loadMore}
              />
            </SheetContent>
          </Sheet>

          {/* Chat Area */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center px-4">
                  <div className="max-w-md">
                    <h2 className="text-xl font-semibold mb-2">Welcome to Marketing Intelligence</h2>
                    <p className="text-sm text-muted-foreground">Ask me anything about content marketing strategies, growth ideas, or campaign suggestions.</p>
                  </div>
                </div>
              ) : (
                <>
                  <MessageList 
                    messages={messages}
                    onQuickReply={(action) => {
                      sendMessage(action.value);
                    }}
                  />
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="border-t px-4 md:px-6 py-4 bg-background">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      !currentSessionId 
                        ? "Creating session..." 
                        : isLoading 
                          ? "Sending..." 
                          : "Ask about marketing strategies, content ideas... (Shift+Enter for new line)"
                    }
                    disabled={isLoading || !currentSessionId}
                    className="flex-1 min-h-[44px] max-h-[200px] resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim() || !currentSessionId}
                    size="icon"
                    className="h-[44px] w-[44px]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleSeedEmbeddings}
                    disabled={isGeneratingEmbeddings}
                    variant="outline"
                    size="sm"
                    className="w-fit"
                  >
                    <Zap className="h-3 w-3 mr-2" />
                    {isGeneratingEmbeddings ? 'Seeding...' : 'Seed Database (5 items)'}
                  </Button>
                  <Button
                    onClick={handleTestSemanticSearch}
                    disabled={isGeneratingEmbeddings}
                    variant="outline"
                    size="sm"
                    className="w-fit"
                  >
                    <Search className="h-3 w-3 mr-2" />
                    {isGeneratingEmbeddings ? 'Searching...' : 'Search: "educational books"'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </AdminOnly>
  );
}
