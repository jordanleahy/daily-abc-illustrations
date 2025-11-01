import { useState, useRef, useEffect, useMemo, useCallback, startTransition } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Book, Trash2, BookOpen, Menu } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useGoogleChat, type SuggestedAction } from '@/hooks/useGoogleChat';
import { useGoogleCreateBook } from '@/hooks/useGoogleCreateBook';
import { useGoogleChatSessions } from '@/hooks/useGoogleChatSessions';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useBookPages } from '@/hooks/useBookPages';
import { ChatSessionSidebar } from '@/components/chat/ChatSessionSidebar';
import { QACheckpointPanel } from '@/components/chat/QACheckpointPanel';
import { MessageList } from '@/components/chat/MessageList';
import { EmptyState } from '@/components/chat/EmptyState';
import { InputArea } from '@/components/chat/InputArea';
import { toast } from 'sonner';
import { BOOK_TYPES } from '@/config/bookTypes';
import { cn } from '@/lib/utils';
import { parsePageDetailsFromMessages, getBookMetadata } from '@/utils/chatHelpers';

export default function GoogleChat() {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const [input, setInput] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
  
  const {
    sessions,
    isLoading: sessionsLoading,
    createSession,
    updateSessionMessages,
    updateSessionName,
    deleteSession,
    linkBookToSession,
    updateQAPageImages,
  } = useGoogleChatSessions();

  // Debounced message update callback
  const debouncedUpdateRef = useRef<NodeJS.Timeout>();
  const handleMessagesUpdate = useCallback(async (updatedMessages: any[]) => {
    if (!currentSessionId) return;
    
    // Clear existing timeout
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    
    // Debounce database updates
    debouncedUpdateRef.current = setTimeout(async () => {
      await updateSessionMessages({
        sessionId: currentSessionId,
        messages: updatedMessages,
      });
    }, 1000); // Wait 1 second after last message
  }, [currentSessionId, updateSessionMessages]);

  const { messages, isLoading, isLoadingSession, sendMessage, sendMessageWithImage, clearMessages } = useGoogleChat(
    currentSessionId || undefined,
    handleMessagesUpdate
  );

  const createBookMutation = useGoogleCreateBook();

  // Track locally created book ID (separate from session data for immediate UI updates)
  const [localCreatedBookId, setLocalCreatedBookId] = useState<string | null>(null);

  // Get the created book ID from current session or local state
  const selectedSession = useMemo(
    () => sessions?.find(s => s.id === currentSessionId),
    [sessions, currentSessionId]
  );
  const createdBookId = localCreatedBookId || selectedSession?.created_book_id || null;

  // Fetch book images from storage if book exists
  const { data: bookPageImages, isLoading: bookImagesLoading } = useBookPageImages(createdBookId);
  
  // Fetch book pages from database if book exists
  const { pages: dbPages } = useBookPages(createdBookId || undefined);

  // QA Checkpoint state
  const [currentQAPage, setCurrentQAPage] = useState(0);
  const [qaPageImages, setQAPageImages] = useState<Record<number, string>>({});
  const [showQACheckpoint, setShowQACheckpoint] = useState(false);
  const [outlineJustCompleted, setOutlineJustCompleted] = useState(false);
  const previousShouldShow = useRef(false);

  // Priority: Show book images from storage if book exists, otherwise show QA checkpoint images
  const displayImages = (createdBookId && bookPageImages) ? bookPageImages : qaPageImages;
  const isBookCreated = !!createdBookId;

  // Memoize parsed page details to avoid re-parsing on every render
  const parsedPageDetails = useMemo(
    () => parsePageDetailsFromMessages(messages),
    [messages]
  );

  // Detect when book outline is ready for QA checkpoint
  const shouldShowQACheckpoint = useMemo(() => {
    if (isLoading || messages.length === 0) return false;
    const hasPages = parsedPageDetails !== null && parsedPageDetails.length >= 5;
    return hasPages && !createBookMutation.isSuccess;
  }, [messages, isLoading, createBookMutation.isSuccess, parsedPageDetails]);

  const pageCount = useMemo(() => {
    // If book is created, use database page count (excluding cover page 0)
    if (isBookCreated && dbPages && dbPages.length > 0) {
      return dbPages.length - 1;
    }
    // Otherwise use parsed page details
    return parsedPageDetails?.length || 0;
  }, [isBookCreated, dbPages, parsedPageDetails]);

  // Helper to get current page prompt - uses database if book is created, otherwise parses messages
  const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
    // If book is created, use database pages (live data)
    if (isBookCreated && dbPages && dbPages.length > 0) {
      const dbPage = dbPages.find(p => p.page_number === pageNum);
      if (dbPage) {
        if (pageNum === 0) {
          // Cover page from database
          return `**Cover: \"${dbPage.title}\"**\n\n${dbPage.description || ''}\n\nCreate a vibrant, engaging 1:1 square illustration that captures this theme. Focus on the main subject or scene. Do not include any text, titles, logos, or publisher names - only the artwork.`;
        }
        // Content page from database
        return `**Page ${pageNum}: \"${dbPage.title}\"**\n\n${dbPage.description || ''}`;
      }
    }
    
    // Fall back to parsing conversation (pre-creation)
    if (pageNum === 0) {
      // Cover page - use book metadata from messages
      const metadata = getBookMetadata(messages);
      if (!metadata) return null;
      
      return `**Cover: \"${metadata.name}\"**\n\n${metadata.description}\n\nCreate a vibrant, engaging 1:1 square illustration that captures this theme. Focus on the main subject or scene. Do not include any text, titles, logos, or publisher names - only the artwork.`;
    }
    
    if (!parsedPageDetails || parsedPageDetails.length === 0) return null;
    
    const page = parsedPageDetails.find((p: any) => p.pageNumber === pageNum);
    if (!page) return null;
    
    return `**Page ${page.pageNumber}: \"${page.title}\"**\n\n${page.description}`;
  }, [isBookCreated, dbPages, messages, parsedPageDetails]);

  // Create initial session on mount if none exists
  useEffect(() => {
    if (sessionsLoading) return;
    
    // Priority 1: Use URL session ID if present
    if (urlSessionId) {
      const sessionExists = sessions.find(s => s.id === urlSessionId);
      if (sessionExists) {
        setCurrentSessionId(urlSessionId);
        return;
      } else {
        // Invalid session ID in URL - redirect to base route
        navigate('/google-chat', { replace: true });
        return;
      }
    }
    
    // Priority 2: Create new session if none exist
    if (sessions.length === 0) {
      handleCreateNewSession();
      return;
    }
    
    // Priority 3: Handle no current session selected
    if (!currentSessionId) {
      if (isMobile) {
        handleCreateNewSession();
      } else {
        // Auto-load most recent conversation
        const mostRecent = sessions[0];
        navigate(`/google-chat/${mostRecent.id}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsLoading, sessions, urlSessionId, currentSessionId, isMobile]);

  // Sync URL when session changes
  useEffect(() => {
    if (currentSessionId && currentSessionId !== urlSessionId) {
      navigate(`/google-chat/${currentSessionId}`, { replace: true });
    }
  }, [currentSessionId, urlSessionId, navigate]);

  // Detect when outline is newly completed (transition from false → true)
  useEffect(() => {
    const currentShouldShow = shouldShowQACheckpoint;
    
    // If we just transitioned from false → true, the outline was just completed
    if (!previousShouldShow.current && currentShouldShow) {
      setOutlineJustCompleted(true);
    }
    
    previousShouldShow.current = currentShouldShow;
  }, [shouldShowQACheckpoint]);

  // Auto-show QA checkpoint only when outline is just completed (not on page load)
  useEffect(() => {
    if (outlineJustCompleted && !showQACheckpoint) {
      setCurrentQAPage(0); // Start at cover page
      
      if (isMobile) {
        // Don't auto-open on mobile — keep the brand chat experience visible
        toast.info('Outline is ready. Tap Review to open the panel.');
      } else {
        setShowQACheckpoint(true);
      }
      
      // Scroll to bottom to show the banner
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Reset flag after opening
      setOutlineJustCompleted(false);
    }
  }, [outlineJustCompleted, showQACheckpoint, isMobile]);

  // Add quick reply buttons when AI indicates book is ready to create
  const messagesWithCreateOptions = useMemo(() => {
    if (messages.length === 0) return messages;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !lastMessage.suggestedActions) {
      const content = typeof lastMessage.content === 'string' ? lastMessage.content.toLowerCase() : '';
      const isReady = content.includes('create book') || 
                      content.includes('bring your story to life') ||
                      content.includes('ready to create') ||
                      content.includes('click \'create book\'');
      
      if (isReady && pageCount >= 3) {
        // Return messages with suggested actions added to last message
        const updatedMessages = [...messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          suggestedActions: [
            { id: 'create_book', label: '✨ Create Book', value: 'create_book' },
            { id: 'refine_outline', label: 'Refine Outline', value: 'refine_outline' },
            { id: 'start_over', label: 'Start Over', value: 'start_over' }
          ]
        };
        return updatedMessages;
      }
    }
    return messages;
  }, [messages, pageCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  }, [input, isLoading, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleImageSelect = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const message = input.trim() || 'What do you think of this style for inspiration?';
      setInput('');
      setShowImageUpload(false);
      await sendMessageWithImage(message, base64Data);
    };
    reader.readAsDataURL(file);
  }, [input, sendMessageWithImage]);

  const handleBookTypeSelect = useCallback(async (bookType: typeof BOOK_TYPES[0]) => {
    if (bookType.needsClarification && bookType.clarificationContext) {
      // Send clarification request to AI
      const clarificationPrompt = `${bookType.prompt}\n\n[CLARIFICATION_NEEDED: ${bookType.clarificationContext}]`;
      await sendMessage(clarificationPrompt);
    } else {
      // Send direct prompt
      await sendMessage(bookType.prompt);
    }
  }, [sendMessage]);

  const handleCreateBook = useCallback(async () => {
    if (!currentSessionId) {
      toast.error('No active session');
      return;
    }

    if (messages.length === 0) {
      toast.error('Please have a conversation first');
      return;
    }

    // Parse structured page details from conversation
    const pageDetails = parsedPageDetails;
    
    if (pageDetails) {
      console.log(`Extracted ${pageDetails.length} page details from conversation`);
    } else {
      console.log('No structured page details found, will let AI generate structure');
    }

    // Convert messages to simple text format for book creation
    const textMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : '[Image uploaded]'
    }));

    toast.success('Creating book in background...', {
      description: 'You can continue chatting. Check your library shortly.'
    });

    try {
      const result = await createBookMutation.mutateAsync({
        conversationHistory: textMessages,
        pageDetails: pageDetails || undefined,
        qaImages: Object.keys(qaPageImages).length > 0 ? qaPageImages : undefined
      });
      
      // Set local book ID immediately for UI responsiveness
      setLocalCreatedBookId(result.bookId);
      
      // Link book to current session
      await linkBookToSession({ 
        sessionId: currentSessionId, 
        bookId: result.bookId 
      });
      
      toast.success('Book created successfully!', {
        description: 'Click "View Created Book" to see your new book.'
      });
      
      // Reset QA checkpoint state
      setShowQACheckpoint(false);
      setCurrentQAPage(0);
      setQAPageImages({});
    } catch (error) {
      console.error('Book creation error:', error);
      // Error toast is handled by the mutation
    }
  }, [currentSessionId, messages, parsedPageDetails, qaPageImages, createBookMutation, linkBookToSession]);

  const handleQuickReply = useCallback(async (action: SuggestedAction) => {
    // Handle special create book actions
    if (action.value === 'create_book') {
      handleCreateBook();
      return;
    }
    if (action.value === 'refine_outline') {
      // Focus the input to encourage user to continue chatting
      setTimeout(() => {
        const inputElement = document.querySelector<HTMLInputElement>('input[placeholder*="Message"]');
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
      return;
    }
    if (action.value === 'start_over') {
      handleCreateNewSession();
      return;
    }
    
    // Regular quick reply
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
  }, [handleCreateBook, sendMessage]);

  const handleCreateNewSession = useCallback(async () => {
    try {
      const newSession = await createSession(undefined);
      
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        setCurrentSessionId(newSession.id);
        setCurrentQAPage(0);
        setQAPageImages({});
        setShowQACheckpoint(false);
        setLocalCreatedBookId(null);
        setOutlineJustCompleted(false);
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }, [createSession]);

  const handleViewCreatedBook = useCallback(() => {
    if (createdBookId) {
      navigate(`/books/${createdBookId}`);
    }
  }, [createdBookId, navigate]);

  const handleOpenQAPanel = useCallback(() => {
    // Load QA images from current session
    if (selectedSession?.qa_page_images) {
      setQAPageImages(selectedSession.qa_page_images);
    }
    setShowQACheckpoint(true);
    setCurrentQAPage(0);
  }, [selectedSession]);

  const handleSelectSession = useCallback((sessionId: string) => {
    if (sessionId !== currentSessionId) {
      // Batch state updates using startTransition
      startTransition(() => {
        setCurrentSessionId(sessionId);
        setCurrentQAPage(0);
        setShowQACheckpoint(false);
        setLocalCreatedBookId(null);
        setOutlineJustCompleted(false);
        setIsMobileSidebarOpen(false);
        
        // Load QA images from the selected session
        const session = sessions.find(s => s.id === sessionId);
        if (session?.qa_page_images) {
          setQAPageImages(session.qa_page_images);
        } else {
          setQAPageImages({});
        }
      });
    }
  }, [currentSessionId, sessions]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    
    // If we deleted the current session, switch to another one
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        handleCreateNewSession();
      }
    }
  }, [currentSessionId, sessions, deleteSession, handleCreateNewSession]);

  const handleRenameSession = useCallback(async (sessionId: string, name: string) => {
    await updateSessionName({ sessionId, name });
  }, [updateSessionName]);

  const handleQAImageUpload = useCallback(async (imageDataUrl: string) => {
    // Store image for the current page
    const updatedImages = {
      ...qaPageImages,
      [currentQAPage]: imageDataUrl
    };
    setQAPageImages(updatedImages);
    
    // Persist to database
    if (currentSessionId) {
      try {
        await updateQAPageImages({ sessionId: currentSessionId, qaPageImages: updatedImages });
      } catch (error) {
        console.error('Failed to save QA image:', error);
      }
    }
    
    // Auto-advance to next page if not the last page
    if (currentQAPage < pageCount) {
      setTimeout(() => {
        setCurrentQAPage(currentQAPage + 1);
      }, 500);
    } else {
      toast.success('All pages reviewed!', {
        description: 'Click "Create Book" when ready to finalize.'
      });
    }
  }, [qaPageImages, currentQAPage, pageCount, currentSessionId, updateQAPageImages]);

  const handleQAPageNavigation = useCallback((direction: 'next' | 'prev') => {
    if (!parsedPageDetails) return;
    
    const maxPage = parsedPageDetails.length;
    
    if (direction === 'next' && currentQAPage < maxPage) {
      setCurrentQAPage(currentQAPage + 1);
    } else if (direction === 'prev' && currentQAPage > 0) {
      setCurrentQAPage(currentQAPage - 1);
    }
  }, [parsedPageDetails, currentQAPage]);

  const handleRemoveQAImage = useCallback(async (pageNumber: number) => {
    const updatedImages = { ...qaPageImages };
    delete updatedImages[pageNumber];
    setQAPageImages(updatedImages);
    
    if (currentSessionId) {
      try {
        await updateQAPageImages({ sessionId: currentSessionId, qaPageImages: updatedImages });
      } catch (error) {
        console.error('Failed to remove QA image:', error);
      }
    }
  }, [qaPageImages, currentSessionId, updateQAPageImages]);

  return (
    <PageLayout 
      title="Chat with Google Gemini"
      showHeader={true}
      fullHeight={true}
      onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
      showReviewButton={(shouldShowQACheckpoint && !showQACheckpoint) || !!createdBookId}
      onReviewClick={createdBookId ? handleViewCreatedBook : handleOpenQAPanel}
      reviewButtonVariant={createdBookId ? 'view-book' : 'review'}
    >
      <div className="fixed inset-0 top-[3.5rem] flex">
        {/* Review/View Book Button - Desktop only, fixed in top right */}
        {((shouldShowQACheckpoint && !showQACheckpoint) || createdBookId) && (
          <Button
            onClick={createdBookId ? handleViewCreatedBook : handleOpenQAPanel}
            className="hidden md:flex fixed top-20 right-6 z-40 shadow-lg"
            size="sm"
          >
            {createdBookId ? (
              <>
                <Book className="h-4 w-4 mr-1" />
                View Book
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-1" />
                Review Outline
              </>
            )}
          </Button>
        )}

        {/* Desktop: Always-visible Sidebar */}
        <div className={cn(
          "border-r bg-muted/30 flex flex-col h-full transition-all duration-300",
          "hidden md:flex md:w-64 md:resize-x md:overflow-auto",
          "md:relative md:min-w-[200px] md:max-w-[600px]"
        )}>
          <ChatSessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />
        </div>

        {/* Mobile: Overlay Drawer for Sidebar */}
        {isMobile && (
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="w-[280px] p-0 h-full flex flex-col">
              <ChatSessionSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onCreateSession={handleCreateNewSession}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Chat Area - Full width, no margin adjustment */}
        <div className="flex-1 flex flex-col w-full">
          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
            {/* Loading overlay during session switch */}
            {isLoadingSession && messages.length > 0 && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                </div>
              </div>
            )}
            
            {messages.length === 0 && !isLoadingSession ? (
              <EmptyState onBookTypeSelect={handleBookTypeSelect} />
            ) : (
              <div className="max-w-4xl mx-auto px-4 py-6">
                <MessageList 
                  messages={messagesWithCreateOptions}
                  onQuickReply={handleQuickReply}
                />
                {isLoading && (
                  <div className="flex justify-start mt-4">
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

          {/* Input Area - Fixed Footer */}
          <InputArea
            input={input}
            isLoading={isLoading}
            showImageUpload={showImageUpload}
            createdBookId={createdBookId}
            isMobile={isMobile}
            onInputChange={setInput}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
            onImageUploadToggle={setShowImageUpload}
            onImageSelect={handleImageSelect}
            onViewBook={handleOpenQAPanel}
          />
        </div>

        {/* QA Checkpoint Drawer - Slides from Right */}
        <Sheet 
          open={showQACheckpoint && !createBookMutation.isSuccess} 
          onOpenChange={(open) => {
            setShowQACheckpoint(open);
            if (!open) {
              toast.info('Continue chatting to refine prompts');
            }
          }}
        >
          <SheetContent 
            side="right" 
            className="w-full sm:w-[500px] p-0 flex flex-col overflow-hidden"
          >
            <QACheckpointPanel
              showQACheckpoint={true}
              isBookCreated={isBookCreated}
              createdBookId={createdBookId}
              currentQAPage={currentQAPage}
              pageCount={pageCount}
              displayImages={displayImages}
              qaPageImages={qaPageImages}
              getCurrentPagePrompt={getCurrentPagePrompt}
              createBookMutation={createBookMutation}
              onClose={() => setShowQACheckpoint(false)}
              onNavigate={handleQAPageNavigation}
              onImageUpload={handleQAImageUpload}
              onRemoveImage={handleRemoveQAImage}
              onCreateBook={handleCreateBook}
            />
          </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
}
