import { useState, useRef, useEffect, useMemo, useCallback, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useGoogleChat, type SuggestedAction } from '@/hooks/useGoogleChat';
import { useGoogleCreateBook } from '@/hooks/useGoogleCreateBook';
import { useGoogleChatSessions } from '@/hooks/useGoogleChatSessions';
import { useSessionMessages, usePrefetchSession } from '@/hooks/useSessionMessages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useBookPages } from '@/hooks/useBookPages';
import { useThemeImagePreloader } from '@/hooks/useThemeImagePreloader';
import { ChatSessionSidebar } from '@/components/chat/ChatSessionSidebar';
import { QACheckpointPanel } from '@/components/chat/QACheckpointPanel';
import { MessageList } from '@/components/chat/MessageList';
import { EmptyState } from '@/components/chat/EmptyState';
import { InputArea } from '@/components/chat/InputArea';
import { toast } from 'sonner';
import { BOOK_TYPES } from '@/config/bookTypes';
import { cn } from '@/lib/utils';
import { parsePageDetailsFromMessages, getBookMetadata } from '@/utils/chatHelpers';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export default function GoogleChat() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [input, setInput] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedBookType, setSelectedBookType] = useState<string | null>(null);

  // Preload all theme images for instant display
  useThemeImagePreloader();

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
    updateQAPagePrompts,
  } = useGoogleChatSessions();

  // Load messages for current session via React Query cache
  const { data: messages = [], isLoading: isLoadingMessages } = useSessionMessages(currentSessionId || undefined);
  
  // Prefetch hook for hover optimization
  const { prefetchSession } = usePrefetchSession();

  // Debounce message updates to avoid excessive database writes
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const handleMessagesUpdate = useCallback((messages: any[], sessionId: string) => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set new timeout to update after 1 second of inactivity
    updateTimeoutRef.current = setTimeout(() => {
      updateSessionMessages({ sessionId, messages });
    }, 1000);
  }, [updateSessionMessages]);

  const { isLoading, sendMessage, sendMessageWithImage } = useGoogleChat(
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
  const [qaPagePrompts, setQAPagePrompts] = useState<Record<number, string>>({});
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
          // Cover page from database - only use book name as title
          return `${dbPage.description || ''}\n\nAn educational children's book\n\nCreate a vibrant, engaging cover illustration that captures this theme. Place the title "${dbPage.title}" prominently in the center of the image with clear, readable text.`;
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
      
      return `${metadata.description}\n\nAn educational children's book\n\nCreate a vibrant, engaging cover illustration that captures this theme. Place the title "${metadata.name}" prominently in the center of the image with clear, readable text.`;
    }
    
    if (!parsedPageDetails || parsedPageDetails.length === 0) return null;
    
    const page = parsedPageDetails.find((p: any) => p.pageNumber === pageNum);
    if (!page) return null;
    
    return `**Page ${page.pageNumber}: \"${page.title}\"**\n\n${page.description}`;
  }, [isBookCreated, dbPages, messages, parsedPageDetails]);

  // Create initial session on mount if none exists
  useEffect(() => {
    if (sessionsLoading) return;
    
    // Priority 1: Create new session if none exist
    if (sessions.length === 0) {
      handleCreateNewSession();
      return;
    }
    
    // Priority 2: Handle no current session selected
    if (!currentSessionId) {
      if (isMobile) {
        handleCreateNewSession();
      } else {
        // Auto-load most recent conversation
        const mostRecent = sessions[0];
        setCurrentSessionId(mostRecent.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsLoading, sessions, currentSessionId, isMobile]);

  // Detect when outline is newly completed (transition from false → true)
  useEffect(() => {
    const currentShouldShow = shouldShowQACheckpoint;
    
    // If we just transitioned from false → true, the outline was just completed
    if (!previousShouldShow.current && currentShouldShow) {
      setOutlineJustCompleted(true);
      // Auto-generate cover prompt when outline completes
      handleGenerateCoverPrompt();
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
            { id: 'open_qa', label: '📖 View Pages & Add Photos', value: 'open_qa' },
            { id: 'refine_outline', label: 'Refine Outline', value: 'refine_outline' },
            { id: 'start_over', label: 'Start Over', value: 'start_over' }
          ]
        };
        return updatedMessages;
      }
    }
    return messages;
  }, [messages, pageCount]);

  // Smart scroll: only auto-scroll when user is actively chatting or AI is loading
  // Don't auto-scroll when AI finishes (let user see response from top)
  useEffect(() => {
    if (scrollRef.current && isLoading) {
      // Only scroll to bottom while AI is actively responding
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input, undefined, messages);
    setInput('');
  };

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
      await sendMessageWithImage(message, base64Data, messages);
    };
    reader.readAsDataURL(file);
  }, [input, sendMessageWithImage, messages]);

  // Auto-generate cover prompt for QA panel
  const handleGenerateCoverPrompt = useCallback(async () => {
    // Cover prompt generation removed - images now uploaded from external sources
    console.log('Cover prompt generation skipped - using external image generation');
  }, []);

  const handleBookTypeSelect = useCallback(async (bookType: typeof BOOK_TYPES[0]) => {
    // Store the book type ID for later use
    setSelectedBookType(bookType.id);
    
    // Update session name with book type label (silent to avoid toast)
    if (currentSessionId) {
      await updateSessionName({
        sessionId: currentSessionId,
        name: bookType.label,
        silent: true
      });
    }
    
    if (bookType.needsClarification && bookType.clarificationContext) {
      // Format as natural instruction without internal tags
      const clarificationPrompt = `${bookType.prompt}\n\nBefore we proceed, please ask me about: ${bookType.clarificationContext}`;
      await sendMessage(clarificationPrompt);
    } else {
      // Send direct prompt
      await sendMessage(bookType.prompt);
    }
  }, [currentSessionId, sendMessage, updateSessionName]);

  const handleCreateBook = useCallback(async () => {
    if (!currentSessionId) {
      toast.error('No active session');
      return;
    }

    if (messages.length === 0) {
      toast.error('Please have a conversation first');
      return;
    }

    const pageDetails = parsedPageDetails;
    
    if (pageDetails) {
      console.log(`Extracted ${pageDetails.length} page details from conversation`);
    }

    // Extract text overlay and style reference
    let textOverlayPreference: 'with-text' | 'without-text' | undefined;
    let referenceBookId: string | undefined;
    
    for (const msg of messages) {
      if (msg.role === 'user' && typeof msg.content === 'string') {
        const content = msg.content.toLowerCase();
        if (content === 'with text' || content.includes('with text')) {
          textOverlayPreference = 'with-text';
        } else if (content === 'without text' || content.includes('without text')) {
          textOverlayPreference = 'without-text';
        }
        
        const styleMatch = msg.content.match(/style-([a-f0-9-]{36})/i);
        if (styleMatch) {
          referenceBookId = styleMatch[1];
        }
      }
    }

    console.log('Text overlay:', textOverlayPreference, 'Style ref:', referenceBookId);

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
        qaImages: Object.keys(qaPageImages).length > 0 ? qaPageImages : undefined,
        bookType: selectedBookType || undefined,
        textOverlayPreference,
        referenceBookId
      });
      
      // Set local book ID immediately for UI responsiveness
      setLocalCreatedBookId(result.bookId);
      
      // Link book to current session
      await linkBookToSession({ 
        sessionId: currentSessionId, 
        bookId: result.bookId 
      });
      
      // Fetch the book details to get the title and update session name
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('book_name')
        .eq('id', result.bookId)
        .single();
      
      // Update session name with book title
      if (bookData && !bookError) {
        await updateSessionName({
          sessionId: currentSessionId,
          name: bookData.book_name
        });
      }
      
      toast.success('Book created successfully!', {
        description: 'Click "View Created Book" to see your new book.'
      });
      
      // Reset QA checkpoint state
      setShowQACheckpoint(false);
      setCurrentQAPage(0);
      setQAPageImages({});
      setQAPagePrompts({});
    } catch (error) {
      console.error('Book creation error:', error);
      // Error toast is handled by the mutation
    }
  }, [currentSessionId, messages, parsedPageDetails, qaPageImages, createBookMutation, linkBookToSession]);

  const handleQuickReply = useCallback(async (action: SuggestedAction) => {
    // Handle special create book actions
    if (action.value === 'open_qa') {
      handleOpenQAPanel();
      return;
    }
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
      await sendMessage(action.value, undefined, messages);
    } else {
      // "Custom" option - just focus the input field
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [handleCreateBook, sendMessage, messages]);

  const handleCreateNewSession = useCallback(async () => {
    try {
      const newSession = await createSession(undefined);
      
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        setCurrentSessionId(newSession.id);
        setCurrentQAPage(0);
        setQAPageImages({});
        setQAPagePrompts({});
        setShowQACheckpoint(false);
        setLocalCreatedBookId(null);
        setOutlineJustCompleted(false);
        setSelectedBookType(null);
        // Close mobile sidebar when creating new session
        setIsMobileSidebarOpen(false);
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }, [createSession]);

  const handleViewCreatedBook = useCallback(() => {
    // Open QA panel to view the book
    if (createdBookId) {
      // Load QA images from current session
      if (selectedSession?.qa_page_images) {
        setQAPageImages(selectedSession.qa_page_images);
      }
      setShowQACheckpoint(true);
      setCurrentQAPage(0);
    }
  }, [createdBookId, selectedSession]);

  const handleOpenQAPanel = useCallback(() => {
    // Load QA images and prompts from current session
    if (selectedSession?.qa_page_images) {
      setQAPageImages(selectedSession.qa_page_images);
    }
    if (selectedSession?.qa_page_prompts) {
      setQAPagePrompts(selectedSession.qa_page_prompts);
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
        setSelectedBookType(null);
        
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto pt-safe-top">
            {messages.length === 0 ? (
              <EmptyState onBookTypeSelect={handleBookTypeSelect} />
            ) : (
              <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
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
            shouldShowOpenButton={!showQACheckpoint && (shouldShowQACheckpoint || !!createdBookId)}
            onInputChange={setInput}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
            onImageUploadToggle={setShowImageUpload}
            onImageSelect={handleImageSelect}
            onViewBook={handleViewCreatedBook}
            onOpenQAPanel={createdBookId ? handleViewCreatedBook : handleOpenQAPanel}
          />
        </div>

        {/* QA Checkpoint Panel - Desktop: Side Panel, Mobile: Drawer */}
        {isMobile ? (
          // Mobile: Sheet drawer overlay
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
              side="bottom" 
              className="w-full h-[95vh] p-0 flex flex-col overflow-hidden rounded-t-xl z-[100]"
            >
              <QACheckpointPanel
                showQACheckpoint={true}
                isBookCreated={isBookCreated}
                createdBookId={createdBookId}
                currentQAPage={currentQAPage}
                pageCount={pageCount}
                displayImages={displayImages}
                qaPageImages={qaPageImages}
                qaPagePrompts={qaPagePrompts}
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
        ) : (
          // Desktop: Fixed side panel
          showQACheckpoint && !createBookMutation.isSuccess && (
            <div className="w-[500px] border-l flex-none bg-background">
              <QACheckpointPanel
                showQACheckpoint={true}
                isBookCreated={isBookCreated}
                createdBookId={createdBookId}
                currentQAPage={currentQAPage}
                pageCount={pageCount}
                displayImages={displayImages}
                qaPageImages={qaPageImages}
                qaPagePrompts={qaPagePrompts}
                getCurrentPagePrompt={getCurrentPagePrompt}
                createBookMutation={createBookMutation}
                onClose={() => {
                  setShowQACheckpoint(false);
                  toast.info('Continue chatting to refine prompts');
                }}
                onNavigate={handleQAPageNavigation}
                onImageUpload={handleQAImageUpload}
                onRemoveImage={handleRemoveQAImage}
                onCreateBook={handleCreateBook}
              />
            </div>
          )
        )}
      </div>
    </PageLayout>
  );
}
