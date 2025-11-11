import { useState, useRef, useEffect, useMemo, useCallback, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, BookOpen, Book } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useGoogleChat, type SuggestedAction } from '@/hooks/useGoogleChat';
import { useGoogleCreateBook } from '@/hooks/useGoogleCreateBook';
import { useGoogleChatSessions } from '@/hooks/useGoogleChatSessions';
import { useSessionMessages, usePrefetchSession } from '@/hooks/useSessionMessages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useBookPages } from '@/hooks/useBookPages';
import { usePageImageUrlsSubscription } from '@/hooks/usePageImageUrlsSubscription';
import { useThemeImagePreloader } from '@/hooks/useThemeImagePreloader';
import { ChatSessionSidebar } from '@/components/chat/ChatSessionSidebar';
import { QACheckpointPanel } from '@/components/chat/QACheckpointPanel';
import { MessageList } from '@/components/chat/MessageList';
import { EmptyState } from '@/components/chat/EmptyState';
import { InputArea } from '@/components/chat/InputArea';
import { toast } from 'sonner';
import { parsePageDetailsFromMessages, parseEducationalFocus, getBookMetadata } from '@/utils/chatHelpers';
import { BOOK_TYPES } from '@/config/bookTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateBookStatus } from '@/hooks/useUpdateBookStatus';
import { useQuery } from '@tanstack/react-query';
import { PublicationStatus } from '@/types/shared/status';

export default function GoogleChat() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
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
  
  // Track cover page ID for post-creation uploads
  const [coverPageId, setCoverPageId] = useState<string | null>(null);

  // Get the created book ID from current session or local state
  const selectedSession = useMemo(
    () => sessions?.find(s => s.id === currentSessionId),
    [sessions, currentSessionId]
  );
  const createdBookId = localCreatedBookId || selectedSession?.created_book_id || null;

  // Fetch book images from storage if book exists
  const { data: bookPageImages, isLoading: bookImagesLoading } = useBookPageImages(createdBookId);
  
  // Subscribe to real-time page image updates
  usePageImageUrlsSubscription(createdBookId);
  
  // Fetch book pages from database if book exists
  const { pages: dbPages } = useBookPages(createdBookId || undefined);
  
  // Fetch book status
  const { data: bookData } = useQuery({
    queryKey: ['book', createdBookId],
    queryFn: async () => {
      if (!createdBookId) return null;
      const { data, error } = await supabase
        .from('books')
        .select('status')
        .eq('id', createdBookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!createdBookId,
  });
  
  // Only show "View Book" if book is published
  const isBookPublished = bookData?.status === 'published';
  
  const updateBookStatusMutation = useUpdateBookStatus();

  // QA Checkpoint state
  const [currentQAPage, setCurrentQAPage] = useState(1);
  const [qaPageImages, setQAPageImages] = useState<Record<number, string>>({});
  const [qaPagePrompts, setQAPagePrompts] = useState<Record<number, string>>({});
  const [showQACheckpoint, setShowQACheckpoint] = useState(false);
  const [outlineJustCompleted, setOutlineJustCompleted] = useState(false);
  const [replacePageMode, setReplacePageMode] = useState<Record<number, boolean>>({});
  const previousShouldShow = useRef(false);

  // Priority: Show book images from storage if book exists, otherwise show QA checkpoint images
  // But hide images for pages in replace mode
  const displayImages = useMemo(() => {
    const baseImages = (createdBookId && bookPageImages) ? bookPageImages : qaPageImages;
    const filtered: Record<number, string> = {};
    Object.entries(baseImages).forEach(([pageNum, imageUrl]) => {
      if (!replacePageMode[Number(pageNum)]) {
        filtered[Number(pageNum)] = imageUrl;
      }
    });
    return filtered;
  }, [createdBookId, bookPageImages, qaPageImages, replacePageMode]);
  const isBookCreated = !!createdBookId;

  // Memoize parsed page details to avoid re-parsing on every render
  const parsedPageDetails = useMemo(() => {
    const result = parsePageDetailsFromMessages(messages);
    console.log('[QA Debug] Parsed pages:', result?.length || 0, 'pages');
    return result;
  }, [messages]);

  // Detect when book outline is ready for QA checkpoint
  const shouldShowQACheckpoint = useMemo(() => {
    if (isLoading || messages.length === 0) return false;
    const hasPages = parsedPageDetails !== null && parsedPageDetails.length >= 5;
    // Always show button if we have pages, even after book creation
    return hasPages;
  }, [messages, isLoading, parsedPageDetails]);

  // Parse educational focus from messages
  const educationalFocus = useMemo(() => 
    parseEducationalFocus(messages), 
    [messages]
  );

  // Clear cached prompts when new outline is detected (for regeneration support)
  useEffect(() => {
    // Don't detect outline changes for published books
    if (createdBookId && bookData?.status === 'published') {
      return;
    }
    
    if (parsedPageDetails && parsedPageDetails.length > 0) {
      // Check if this is a new/different outline by comparing page count
      const currentPageCount = Object.keys(qaPagePrompts).length;
      const newPageCount = parsedPageDetails.length + (educationalFocus ? 2 : 1);
      
      // If page count changed, or if we have parsed details but empty cache, clear the cache
      if (currentPageCount !== newPageCount || currentPageCount === 0) {
        console.log('[QA Debug] New outline detected, clearing cached prompts');
        setQAPagePrompts({});
      }
    }
  }, [parsedPageDetails, educationalFocus, createdBookId, bookData?.status]);

  const pageCount = useMemo(() => {
    // If book is created, use database pages count
    if (isBookCreated && dbPages) {
      return dbPages.length;
    }
    // Pre-creation: Cover + Educational Focus (if exists) + parsed pages
    const contentPages = parsedPageDetails?.length || 0;
    return educationalFocus ? contentPages + 2 : contentPages + 1;
  }, [isBookCreated, dbPages, parsedPageDetails, educationalFocus]);
  
  // Get the max page number for navigation boundaries
  const maxPageNumber = useMemo(() => {
    if (isBookCreated && dbPages && dbPages.length > 0) {
      return Math.max(...dbPages.map(p => p.page_number));
    }
    return pageCount;
  }, [isBookCreated, dbPages, pageCount]);

  // Helper to get current page prompt - uses database if book is created, otherwise parses messages
  const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
    // If book is created, get from database
    if (isBookCreated && dbPages && dbPages.length > 0) {
      const page = dbPages.find(p => p.page_number === pageNum);
      if (!page) return null;
      
      // For educational focus page (page 2), check if it's the FOCUS page
      if (page.letter === 'FOCUS' && qaPagePrompts[2]) {
        return qaPagePrompts[2];
      }
      
      // Try to get from qaPagePrompts first (user-uploaded or edited)
      if (qaPagePrompts[pageNum]) {
        return qaPagePrompts[pageNum];
      }
      
      // Fallback to page description
      return page.description || null;
    }
    
    // Pre-creation: parse from messages
    if (pageNum === 1) {
      // Cover page (Page 1)
      const lastCoverMsg = [...messages].reverse().find(
        (msg) => typeof msg.content === 'string' && /\*\*Cover:/i.test(msg.content)
      );
      
      if (!lastCoverMsg || typeof lastCoverMsg.content !== 'string') {
        return null;
      }
      
      // Extract cover description and title
      const content = lastCoverMsg.content as string;
      const titleMatch = content.match(/\*\*Cover:\s*([^*\n]+?)\*\*/i);
      const descMatch = content.match(/\*\*Cover:[^\n*]*\*\*\s*([\s\S]*?)(?=\n\*\*Educational Focus:|\n\*\*Page\s+\d+|$)/i);
      
      if (!descMatch) return null;
      
      const bookTitle = titleMatch ? titleMatch[1].trim() : '';
      let description = descMatch[1].trim();
      
      // Replace "book cover" with "square card cover" to ensure 1:1 aspect ratio
      description = description.replace(/\bbook cover\b/gi, 'square card cover');
      
      // Format with title and text overlay instruction
      return `**Cover: ${bookTitle}**\nSquare card cover (1:1 aspect ratio). ${description}\n\nInclude text overlay displaying '${bookTitle.toUpperCase()}' in large, clear, child-friendly letters.`;
    }
    
    if (pageNum === 2 && educationalFocus) {
      // Educational focus page (Page 2)
      return `Educational Focus\n${educationalFocus.imagePrompt}`;
    }
    
    // Regular content pages (Page 3+)
    if (parsedPageDetails && pageNum > 2) {
      const pageIndex = pageNum - 3; // Page 3 = index 0, Page 4 = index 1, etc.
      const pageDetail = parsedPageDetails[pageIndex];
      return pageDetail ? qaPagePrompts[pageNum] || pageDetail.description : null;
    }
    
    return null;
  }, [isBookCreated, dbPages, qaPagePrompts, educationalFocus, parsedPageDetails, messages]);

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
    // Don't detect completion for published books
    if (createdBookId && bookData?.status === 'published') {
      return;
    }
    
    const currentShouldShow = shouldShowQACheckpoint;
    
    // If we just transitioned from false → true, the outline was just completed
    if (!previousShouldShow.current && currentShouldShow) {
      setOutlineJustCompleted(true);
      // Auto-generate cover prompt when outline completes
      handleGenerateCoverPrompt();
    }
    
    previousShouldShow.current = currentShouldShow;
  }, [shouldShowQACheckpoint, createdBookId, bookData?.status]);

  // Auto-show QA checkpoint only when outline is just completed (not on page load)
  useEffect(() => {
    // Don't auto-show QA for published books
    if (createdBookId && bookData?.status === 'published') {
      return;
    }
    
    if (outlineJustCompleted && !showQACheckpoint) {
      setCurrentQAPage(1); // Start at cover page
      
      if (!isMobile) {
        setShowQACheckpoint(true);
      }
      
      // Scroll to bottom to show the banner
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Reset flag after opening
      setOutlineJustCompleted(false);
    }
  }, [outlineJustCompleted, showQACheckpoint, isMobile, createdBookId, bookData?.status]);

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

  // Smart scroll: only auto-scroll when user sends a message
  // Keep viewport at top when AI responds so user sees text first
  const previousMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    if (scrollRef.current) {
      // If user just sent a message (messages increased), scroll to bottom
      if (messages.length > previousMessagesLengthRef.current && !isLoading) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      // Update the ref for next comparison
      previousMessagesLengthRef.current = messages.length;
    }
  }, [messages.length, isLoading]);

  const handleSend = async () => {
    const raw = input.trim();
    if (!raw) return;

    // If the user is asking for the Review/View Outline button, surface a clickable option in chat
    const lower = raw.toLowerCase();
    const asksForOutline = (
      lower.includes('review outline') ||
      lower.includes('view outline') ||
      lower.includes('review button') ||
      lower.includes('view button') ||
      (lower.includes('review') && (lower.includes('outline') || lower.includes('pages'))) ||
      lower.includes('open qa') || lower.includes('open review')
    );

    if (asksForOutline && currentSessionId) {
      const userMsg = { role: 'user' as const, content: raw };
      const action = createdBookId
        ? { id: 'view_book', label: 'View Book', value: 'view_book' }
        : { id: 'open_qa', label: '📖 View Pages & Add Photos', value: 'open_qa' };
      const assistantMsg = {
        role: 'assistant' as const,
        content: createdBookId
          ? 'Your book is ready. Use the button below to view it.'
          : 'Your outline is ready. Use the button below to review pages and add photos.',
        suggestedActions: [action]
      };

      const newMessages = [...messages, userMsg, assistantMsg];
      // Update cache immediately
      queryClient.setQueryData(['session-messages', currentSessionId], newMessages);
      // Persist to DB
      await updateSessionMessages({ sessionId: currentSessionId, messages: newMessages as any });
      setInput('');
      return;
    }

    await sendMessage(raw, undefined, messages, {
      outlineReady: shouldShowQACheckpoint && !createdBookId,
      bookCreated: !!createdBookId
    });
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
      await sendMessageWithImage(message, base64Data, messages, {
        outlineReady: shouldShowQACheckpoint && !createdBookId,
        bookCreated: !!createdBookId
      });
    };
    reader.readAsDataURL(file);
  }, [input, sendMessageWithImage, messages, shouldShowQACheckpoint, createdBookId]);

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
      await sendMessage(clarificationPrompt, undefined, messages, {
        outlineReady: shouldShowQACheckpoint && !createdBookId,
        bookCreated: !!createdBookId
      });
    } else {
      // Send direct prompt
      await sendMessage(bookType.prompt, undefined, messages, {
        outlineReady: shouldShowQACheckpoint && !createdBookId,
        bookCreated: !!createdBookId
      });
    }
  }, [currentSessionId, sendMessage, updateSessionName, shouldShowQACheckpoint, createdBookId]);

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
      
      
      // Reset image/prompt state for next book (keep panel open)
      setQAPageImages({});
      setQAPagePrompts({});
    } catch (error) {
      console.error('Book creation error:', error);
      // Error toast is handled by the mutation
    }
  }, [currentSessionId, messages, parsedPageDetails, qaPageImages, createBookMutation, linkBookToSession]);

  const handleQuickReply = useCallback(async (action: SuggestedAction) => {
    // Handle special actions
    if (action.value === 'open_qa') {
      handleOpenQAPanel();
      return;
    }
    if (action.value === 'view_book') {
      handleViewCreatedBook();
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
      await sendMessage(action.value, undefined, messages, {
        outlineReady: shouldShowQACheckpoint && !createdBookId,
        bookCreated: !!createdBookId
      });
    } else {
      // "Custom" option - just focus the input field
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [handleCreateBook, sendMessage, messages, shouldShowQACheckpoint, createdBookId]);
  // Note: handleOpenQAPanel, handleViewCreatedBook, handleCreateNewSession are not in deps
  // because they're useCallback functions defined below and are stable

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
        setReplacePageMode({});
        // Close mobile sidebar when creating new session
        setIsMobileSidebarOpen(false);
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }, [createSession]);

  const handleViewCreatedBook = useCallback(() => {
    // Navigate to reading view with session context
    if (createdBookId) {
      navigate(`/books/${createdBookId}/read`, { 
        state: { 
          from: 'google-chat',
          sessionId: currentSessionId 
        } 
      });
    }
  }, [createdBookId, currentSessionId, navigate]);

  const handleOpenQAPanel = useCallback(() => {
    // Reset mutation state to allow panel to open after book creation
    createBookMutation.reset();
    
    // Load QA images and prompts from current session
    if (selectedSession?.qa_page_images) {
      setQAPageImages(selectedSession.qa_page_images);
    }
    if (selectedSession?.qa_page_prompts) {
      setQAPagePrompts(selectedSession.qa_page_prompts);
    }
    setShowQACheckpoint(true);
    setCurrentQAPage(1);
  }, [selectedSession, createBookMutation]);

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
        setReplacePageMode({});
        
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
    
    // If we deleted the current session, always create a new one immediately
    if (sessionId === currentSessionId) {
      handleCreateNewSession();
    }
  }, [currentSessionId, deleteSession, handleCreateNewSession]);

  const handleRenameSession = useCallback(async (sessionId: string, name: string) => {
    await updateSessionName({ sessionId, name });
  }, [updateSessionName]);

  const handleQAImageUpload = useCallback(async (imageDataUrl: string) => {
    // If book is created, update actual page image
    if (createdBookId && dbPages) {
      const currentPage = dbPages.find(p => p.page_number === currentQAPage);
      if (!currentPage) {
        toast.error('Page not found');
        return;
      }

      try {
        toast.info('Uploading image...');
        
        // Convert base64 to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `page-${currentQAPage}-${Date.now()}.png`, { type: 'image/png' });
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('page-images')
          .upload(`${user?.id}/${createdBookId}/page-${currentQAPage}-${Date.now()}.png`, file, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('page-images')
          .getPublicUrl(uploadData.path);
        
        // Get next version number
        const { data: existingImages } = await supabase
          .from('page_image_urls')
          .select('version_number')
          .eq('page_id', currentPage.id)
          .order('version_number', { ascending: false })
          .limit(1);
        
        const nextVersion = (existingImages?.[0]?.version_number || 0) + 1;
        
        // Mark all previous versions as not latest
        await supabase
          .from('page_image_urls')
          .update({ is_latest: false })
          .eq('page_id', currentPage.id);
        
        // Insert new image record
        const { error: insertError } = await supabase
          .from('page_image_urls')
          .insert({
            page_id: currentPage.id,
            book_id: createdBookId,
            user_id: user?.id,
            version_number: nextVersion,
            image_url: publicUrl,
            source_type: 'user_uploaded',
            is_latest: true,
          });
        
        if (insertError) throw insertError;
        
        // Invalidate queries to refetch images
        await queryClient.invalidateQueries({ queryKey: ['book-page-images', createdBookId] });
        
        // Clear replace mode for this page
        setReplacePageMode(prev => {
          const updated = { ...prev };
          delete updated[currentQAPage];
          return updated;
        });
        
        // Auto-advance to next page if not the last page
        if (currentQAPage < pageCount) {
          setTimeout(() => {
            setCurrentQAPage(currentQAPage + 1);
          }, 500);
        }
      } catch (error: any) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image: ' + error.message);
      }
    } else {
      // Pre-creation: Store in session QA images
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
    }
  }, [qaPageImages, currentQAPage, pageCount, currentSessionId, updateQAPageImages, createdBookId, dbPages, user, queryClient]);

  const handleQAPageNavigation = useCallback((direction: 'next' | 'prev') => {
    // If book is created, use actual page numbers from database
    if (isBookCreated && dbPages && dbPages.length > 0) {
      const sortedPages = [...dbPages].sort((a, b) => a.page_number - b.page_number);
      const currentIndex = sortedPages.findIndex(p => p.page_number === currentQAPage);
      
      if (direction === 'next' && currentIndex < sortedPages.length - 1) {
        setCurrentQAPage(sortedPages[currentIndex + 1].page_number);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentQAPage(sortedPages[currentIndex - 1].page_number);
      }
      return;
    }
    
    // Pre-creation navigation with educational focus
    const maxPage = (parsedPageDetails?.length || 0) + (educationalFocus ? 2 : 1);
    
    if (direction === 'next' && currentQAPage < maxPage) {
      setCurrentQAPage(currentQAPage + 1);
    } else if (direction === 'prev' && currentQAPage > 1) {
      setCurrentQAPage(Math.max(1, currentQAPage - 1));
    }
  }, [parsedPageDetails, currentQAPage, educationalFocus, isBookCreated, dbPages]);

  const handleRemoveQAImage = useCallback(async (pageNumber: number) => {
    if (createdBookId) {
      // For created books, just enable replace mode to show upload UI
      setReplacePageMode(prev => ({ ...prev, [pageNumber]: true }));
    } else {
      // For pre-creation, remove from QA images
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
    }
  }, [qaPageImages, currentSessionId, updateQAPageImages, createdBookId]);

  // Update page text overlay
  const handleUpdatePageText = useCallback(async (pageNumber: number, newText: string) => {
    console.log('handleUpdatePageText called', { pageNumber, newText, createdBookId, dbPagesLength: dbPages?.length });
    
    if (!createdBookId) {
      console.error('Cannot save: No book ID');
      toast.error('Please create the book first');
      return;
    }
    
    if (!dbPages) {
      console.error('Cannot save: Pages data not loaded');
      toast.error('Loading book data, please try again');
      return;
    }
    
    const page = dbPages.find(p => p.page_number === pageNumber);
    if (!page) {
      console.error('Page not found:', pageNumber, 'Available pages:', dbPages.map(p => p.page_number));
      toast.error('Page not found');
      return;
    }
    
    console.log('Updating page:', page.id, 'with text:', newText);
    
    try {
      // Update the page content with new text overlay
      const updatedContent = {
        ...(page.content || {}),
        textOverlay: {
          ...((page.content as any)?.textOverlay || {}),
          enabled: true,
          text: newText,
          position: 'bottom-center' as const
        }
      } as any;
      
      console.log('Saving updated content:', updatedContent);
      
      const { error } = await supabase
        .from('pages')
        .update({ 
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', page.id);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Text saved successfully');
      
      // Invalidate queries to refresh
      await queryClient.invalidateQueries({ queryKey: ['book-pages', createdBookId] });
    } catch (error) {
      console.error('Error updating text:', error);
      toast.error('Failed to update text');
    }
  }, [createdBookId, dbPages, queryClient]);

  // Toggle book status between draft and published
  const handleToggleBookStatus = useCallback(async () => {
    if (!createdBookId) {
      toast.error('Book not ready');
      return;
    }
    
    const currentStatus = bookData?.status || PublicationStatus.DRAFT;
    const newStatus = currentStatus === PublicationStatus.DRAFT 
      ? PublicationStatus.PUBLISHED 
      : PublicationStatus.DRAFT;
    
    updateBookStatusMutation.mutate({
      bookId: createdBookId,
      status: newStatus,
    });
  }, [createdBookId, bookData?.status, updateBookStatusMutation]);

  // Extract page text overlays from database pages
  const pageTextOverlays = useMemo(() => {
    if (!dbPages) return {};
    
    return dbPages.reduce((acc, page) => ({
      ...acc,
      [page.page_number]: (page.content as any)?.textOverlay?.text || page.title
    }), {} as Record<number, string>);
  }, [dbPages]);

  // Fetch cover page ID when book is created
  useEffect(() => {
    if (!createdBookId) {
      setCoverPageId(null);
      return;
    }
    
    const fetchCoverPage = async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id')
        .eq('book_id', createdBookId)
        .eq('page_number', 1)
        .single();
      
      if (!error && data) {
        setCoverPageId(data.id);
      }
    };
    
    fetchCoverPage();
  }, [createdBookId]);

  // Handle thumbnail image upload (separate from cover page)
  const handleThumbnailUpload = useCallback(async (file: File) => {
    if (!createdBookId) {
      toast.error('Book not created yet');
      return;
    }
    
    try {
      toast.info('Uploading thumbnail...');
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(`${user?.id}/${createdBookId}/thumbnail-${Date.now()}.png`, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('page-images')
        .getPublicUrl(uploadData.path);
      
      // Update book with thumbnail URL
      const { error: updateError } = await supabase
        .from('books')
        .update({ thumbnail_url: publicUrl })
        .eq('id', createdBookId);
      
      if (updateError) throw updateError;
      
      // Invalidate book query to refetch with new thumbnail
      await queryClient.invalidateQueries({ queryKey: ['book', createdBookId] });
      await queryClient.invalidateQueries({ queryKey: ['book-thumbnail', createdBookId] });
      await queryClient.invalidateQueries({ queryKey: ['books', user?.id] });
      
      // Also update the local state immediately
      setThumbnailUrl(publicUrl);
      
      toast.success('Thumbnail uploaded successfully!');
    } catch (error: any) {
      console.error('Thumbnail upload error:', error);
      toast.error('Failed to upload thumbnail: ' + error.message);
    }
  }, [createdBookId, user, queryClient]);

  // Fetch current thumbnail URL
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!createdBookId) {
      setThumbnailUrl(null);
      return;
    }
    
    const fetchThumbnail = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('thumbnail_url')
        .eq('id', createdBookId)
        .single();
      
      if (!error && data?.thumbnail_url) {
        setThumbnailUrl(data.thumbnail_url);
      }
    };
    
    fetchThumbnail();
  }, [createdBookId]);

  return (
    <PageLayout 
      title="Chat with Google Gemini"
      showHeader={true}
      fullHeight={true}
      onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
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

        {/* Main Chat Area - Adjusts width for desktop side panel */}
        <div className={cn(
          "flex-1 flex flex-col w-full transition-all duration-300",
          !isMobile && showQACheckpoint && !createBookMutation.isSuccess && "mr-[400px]"
        )}>
          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto pt-safe-top">
            {messages.length === 0 ? (
              <EmptyState onBookTypeSelect={handleBookTypeSelect} />
            ) : (
              <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
                <MessageList 
                  messages={messagesWithCreateOptions}
                  onQuickReply={handleQuickReply}
                  isBookCreated={!!createdBookId}
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
            createdBookId={isBookPublished ? createdBookId : null}
            isMobile={isMobile}
            shouldShowReviewButton={shouldShowQACheckpoint || isBookPublished}
            onInputChange={setInput}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
            onImageUploadToggle={setShowImageUpload}
            onImageSelect={handleImageSelect}
            onViewBook={handleViewCreatedBook}
            onOpenReview={handleOpenQAPanel}
          />
        </div>


        {/* QA Checkpoint Panel - Responsive: Bottom Sheet on Mobile, Sliding Div on Desktop */}
        {isMobile ? (
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
              className="w-full max-h-[90vh] p-0 overflow-hidden rounded-t-xl z-[100]"
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
                coverPageId={coverPageId}
                bookId={createdBookId}
              onCoverUpload={handleThumbnailUpload}
              thumbnailUrl={thumbnailUrl}
              pageTextOverlays={pageTextOverlays}
              onUpdatePageText={handleUpdatePageText}
              onToggleStatus={handleToggleBookStatus}
              bookStatus={(bookData?.status as PublicationStatus) || PublicationStatus.DRAFT}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <div
            className={cn(
              "fixed right-0 top-[3.5rem] bottom-0 w-[400px] bg-background border-l shadow-lg z-[100]",
              "transition-transform duration-300 ease-out",
              showQACheckpoint && !createBookMutation.isSuccess
                ? "translate-x-0"
                : "translate-x-full"
            )}
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
              coverPageId={coverPageId}
              bookId={createdBookId}
                onCoverUpload={handleThumbnailUpload}
                thumbnailUrl={thumbnailUrl}
                pageTextOverlays={pageTextOverlays}
                onUpdatePageText={handleUpdatePageText}
                onToggleStatus={handleToggleBookStatus}
                bookStatus={(bookData?.status as PublicationStatus) || PublicationStatus.DRAFT}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
