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
import { useChatBookCoversPreloader } from '@/hooks/useChatBookCoversPreloader';
import { ChatSessionSidebar } from '@/components/chat/ChatSessionSidebar';
import { BookEditorPanel } from '@/components/chat/BookEditorPanel';
import { MessageList } from '@/components/chat/MessageList';
import { EmptyState } from '@/components/chat/EmptyState';
import { InputArea } from '@/components/chat/InputArea';
import { parsePageDetailsFromMessages, parseEducationalFocus, getBookMetadata } from '@/utils/chatHelpers';
import { parseBookOutline, getPagePrompt, extractPromptsRecord } from '@/utils/pageHelpers';
import { BOOK_TYPES, BookType } from '@/config/bookTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateBookStatus } from '@/hooks/useUpdateBookStatus';
import { useQuery } from '@tanstack/react-query';
import { PublicationStatus } from '@/types/shared/status';
import { useWordMetadata } from '@/hooks/useWordMetadata';
import { BookTypeId } from '@/types/bookType';
import { AgeRangeId } from '@/types/ageRange';
import type { CharacterThemeValue } from '@/types/characterTheme';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useCharacterSelectionFlow } from '@/hooks/useCharacterSelectionFlow';
import { useCharacterSelectionInjection } from '@/components/chat/CharacterSelectionStep';
import { differenceInYears, differenceInMonths } from 'date-fns';
import { AdminOnly } from '@/components/AdminOnly';
import { compositeTextOnImage } from '@/utils/imageTextCompositor';

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
  const [selectedBookType, setSelectedBookType] = useState<BookTypeId | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRangeId | null>(null);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  
  // Get kid profiles
  const { data: kidProfiles = [] } = useKidProfiles();
  
  // Auto-select kid if there's exactly one profile
  useEffect(() => {
    if (kidProfiles.length === 1 && !selectedKidId) {
      setSelectedKidId(kidProfiles[0].id);
    }
  }, [kidProfiles, selectedKidId]);
  
  // Get location state for pre-filled prompts and target words from recommendations
  const locationState = window.history.state?.usr || {};
  const initialPrompt = locationState.initialPrompt || '';
  const targetWords = locationState.targetWords || [];
  const editBookId = locationState.editBookId || null;

  // Preload all theme images and book covers for instant display
  useThemeImagePreloader();
  useChatBookCoversPreloader();

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
    hasMore,
    loadMore,
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

  // Calculate kid age if selected
  const kidAge = useMemo(() => {
    if (!selectedKidId) return undefined;
    const kid = kidProfiles.find(k => k.id === selectedKidId);
    if (!kid?.date_of_birth) return undefined;
    
    const birthDate = new Date(kid.date_of_birth);
    const years = differenceInYears(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate) % 12;
    
    return { years, months };
  }, [selectedKidId, kidProfiles]);

  const { isLoading, sendMessage, sendMessageWithImage } = useGoogleChat(
    currentSessionId || undefined,
    handleMessagesUpdate,
    kidAge,
    selectedBookType || undefined
  );

  const createBookMutation = useGoogleCreateBook();

  // Word metadata hook for regenerating word carousel data
  const { generateMetadata } = useWordMetadata();

  // Track locally created book ID (separate from session data for immediate UI updates)
  const [localCreatedBookId, setLocalCreatedBookId] = useState<string | null>(null);
  
  // Character selection flow - single source of truth for theme + character state
  // This hook manages theme detection, character loading, and selection confirmation
  const characterFlow = useCharacterSelectionFlow();
  
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
        .select('status, book_name, book_description, metadata')
        .eq('id', createdBookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!createdBookId,
  });

  // Sync selectedBookType from book metadata when loading a session with a created book
  useEffect(() => {
    const bookType = (bookData?.metadata as { bookType?: string } | null)?.bookType;
    if (bookType && !selectedBookType) {
      setSelectedBookType(bookType as BookTypeId);
    }
  }, [bookData?.metadata, selectedBookType]);
  
  // Only show "View Book" if book is published
  const isBookPublished = bookData?.status === 'published';
  
  const updateBookStatusMutation = useUpdateBookStatus();

  // Book Editor Panel state  
  const [currentEditorPage, setCurrentEditorPage] = useState(1);
  const [editorPageImages, setEditorPageImages] = useState<Record<number, string>>({});
  const [editorPagePrompts, setEditorPagePrompts] = useState<Record<number, string>>({});
  const [outlineJustCompleted, setOutlineJustCompleted] = useState(false);
  const [replacePageMode, setReplacePageMode] = useState<Record<number, boolean>>({});
  const previousShouldShow = useRef<boolean | null>(null); // null = skip first render
  // Start with editor closed - only open when outline is newly completed or user clicks "View Pages"
  const [forceEditorClosed, setForceEditorClosed] = useState(true);

  // Priority: Show book images from storage if book exists, otherwise show Book Editor images
  // But hide images for pages in replace mode
  const displayImages = useMemo(() => {
    const baseImages = (createdBookId && bookPageImages) ? bookPageImages : editorPageImages;
    const filtered: Record<number, string> = {};
    Object.entries(baseImages).forEach(([pageNum, imageUrl]) => {
      if (!replacePageMode[Number(pageNum)]) {
        filtered[Number(pageNum)] = imageUrl as string;
      }
    });
    return filtered;
  }, [createdBookId, bookPageImages, editorPageImages, replacePageMode]);
  const isBookCreated = !!createdBookId;

  // Parse book outline using new structured parser
  const bookOutline = useMemo(() => {
    return parseBookOutline(messages);
  }, [messages]);
  
  // DEPRECATED: parsedPageDetails removed - use bookOutline instead

  // Detect when book outline is ready for Book Editor Panel
  const shouldShowReviewButton = useMemo(() => {
    if (isLoading || !bookOutline) return false;
    
    const bookTypeConfig = selectedBookType 
      ? BOOK_TYPES.find(bt => bt.id === selectedBookType)
      : null;
    const expectedCount = bookTypeConfig?.expectedPageCount ?? 28;
    
    const hasAllPages = bookOutline.totalPages === expectedCount;
    
    // ABC validation: verify A-Z letters present
    if (selectedBookType === 'abc' && hasAllPages) {
      const letters = bookOutline.contentPages
        .map(p => p.title.match(/\(([A-Za-z])\)/)?.[1]?.toUpperCase())
        .filter(Boolean);
      
      return letters.length === 26 && 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').every(l => letters.includes(l));
    }
    
    return hasAllPages;
  }, [isLoading, bookOutline, selectedBookType]);

  // Derive showEditor from whether outline is ready or book exists
  const showEditor = (shouldShowReviewButton || isBookCreated) && !forceEditorClosed;

  // Parse educational focus from messages
  const educationalFocus = useMemo(() => {
    return parseEducationalFocus(messages);
  }, [messages]);

  // Clear cached prompts when new outline is detected (for regeneration support)
  useEffect(() => {
    // Don't detect outline changes for published books
    if (createdBookId && bookData?.status === 'published') {
      return;
    }
    
    if (bookOutline && bookOutline.totalPages > 0) {
      // Check if this is a new/different outline by comparing page count
      const currentPageCount = Object.keys(editorPagePrompts).length;
      const newPageCount = bookOutline.totalPages;
      
      // If page count changed, or if we have parsed details but empty cache, clear the cache
      if (currentPageCount !== newPageCount || currentPageCount === 0) {
        setEditorPagePrompts({});
      }
    }
  }, [bookOutline, createdBookId, bookData?.status]);

  const pageCount = useMemo(() => {
    if (isBookCreated && dbPages) return dbPages.length;
    return bookOutline?.totalPages || 0;
  }, [isBookCreated, dbPages, bookOutline]);
  
  // Get the max page number for navigation boundaries
  const maxPageNumber = useMemo(() => {
    if (isBookCreated && dbPages && dbPages.length > 0) {
      return Math.max(...dbPages.map(p => p.page_number));
    }
    return pageCount;
  }, [isBookCreated, dbPages, pageCount]);

  // Helper to get current page prompt - ALWAYS prioritizes stored prompts from qa_page_prompts
  const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
    // PRIORITY 1: Always check stored prompts from "View Outline" first
    if (editorPagePrompts[pageNum]) {
      return editorPagePrompts[pageNum];
    }

    // PRIORITY 2: If book is created, get from database
    if (isBookCreated && dbPages && dbPages.length > 0) {
      const page = dbPages.find(p => p.page_number === pageNum);
      if (!page) return null;
      
      // Try to get full prompt from content.imagePrompt (stores unlimited text)
      const fullPrompt = (page.content as any)?.imagePrompt;
      if (fullPrompt) {
        return fullPrompt;
      }
      
      // Fallback to page description (may be truncated)
      if (page.description) {
        return page.description;
      }
      
      return null;
    }
    
    // PRIORITY 3: Pre-creation - use new structured outline with direct lookup
    const prompt = getPagePrompt(bookOutline, pageNum);
    
    // Special handling for cover page - ensure centered title
    if (pageNum === 1 && prompt) {
      let description = prompt;
      
      // Replace "book cover" with "square card cover"
      description = description.replace(/\bbook cover\b/gi, 'square card cover');
      
      // Ensure centered title instruction exists
      if (!description.toLowerCase().includes('centered') && 
          !description.toLowerCase().includes('center')) {
        description = `${description}\n\nDISPLAY TITLE: Centered, large, bold letters taking up 50-60% of space.`;
      }
      
      return description;
    }
    
    return prompt;
  }, [isBookCreated, dbPages, editorPagePrompts, bookOutline]);

  // Helper to get current page title - mirrors getCurrentPagePrompt pattern
  const getCurrentPageTitle = useCallback((pageNum: number): string | null => {
    // Before book creation - use parsed outline
    if (bookOutline) {
      return bookOutline.allPages.get(pageNum)?.title || null;
    }
    // After book creation - use database
    if (isBookCreated && dbPages && dbPages.length > 0) {
      const page = dbPages.find(p => p.page_number === pageNum);
      return page?.title || null;
    }
    return null;
  }, [bookOutline, isBookCreated, dbPages]);

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
    
    const currentShouldShow = shouldShowReviewButton;
    
    // Skip first render - initialize previousShouldShow without triggering
    if (previousShouldShow.current === null) {
      previousShouldShow.current = currentShouldShow;
      return;
    }
    
    // If we just transitioned from false → true, the outline was just completed
    if (!previousShouldShow.current && currentShouldShow) {
      setOutlineJustCompleted(true);
      // Auto-generate cover prompt when outline completes
      handleGenerateCoverPrompt();
    }
    
    previousShouldShow.current = currentShouldShow;
  }, [shouldShowReviewButton, createdBookId, bookData?.status]);

  // Auto-show Book Editor Panel only when outline is just completed (not on page load)
  useEffect(() => {
    // Don't auto-show QA for published books
    if (createdBookId && bookData?.status === 'published') {
      return;
    }
    
    if (outlineJustCompleted) {
      setCurrentEditorPage(1); // Start at cover page
      setForceEditorClosed(false); // Allow editor to open for newly completed outline
      
      // Scroll to bottom to show the banner
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Reset flag after opening
      setOutlineJustCompleted(false);
    }
  }, [outlineJustCompleted, isMobile, createdBookId, bookData?.status]);

  // Auto-show Book Editor Panel only when outline is just completed (not on page load)
  useEffect(() => {
    // Don't auto-show QA for published books
    if (createdBookId && bookData?.status === 'published') {
      return;
    }
    
    if (outlineJustCompleted) {
      setCurrentEditorPage(1); // Start at cover page
      setForceEditorClosed(false); // Allow editor to open for newly completed outline
      
      // Scroll to bottom to show the banner
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Reset flag after opening
      setOutlineJustCompleted(false);
    }
  }, [outlineJustCompleted, isMobile, createdBookId, bookData?.status]);

  // Use refactored hook for character selection injection
  const messagesWithCharacterSelection = useCharacterSelectionInjection({
    flowState: characterFlow.state,
    messages,
  });

  // Add quick reply buttons when AI indicates book is ready to create
  const messagesWithCreateOptions = useMemo(() => {
    if (messagesWithCharacterSelection.length === 0) return messagesWithCharacterSelection;
    
    // If character selection is already injected, just return those messages
    if (characterFlow.needsCharacterSelection) return messagesWithCharacterSelection;
    
    const lastMessage = messagesWithCharacterSelection[messagesWithCharacterSelection.length - 1];
    if (lastMessage?.role === 'assistant' && !lastMessage.suggestedActions) {
      const content = typeof lastMessage.content === 'string' ? lastMessage.content.toLowerCase() : '';
      const isReady = content.includes('create book') || 
                      content.includes('bring your story to life') ||
                      content.includes('ready to create') ||
                      content.includes('click \'create book\'');
      
      if (isReady && pageCount >= 3) {
        // Return messages with suggested actions added to last message
        const updatedMessages = [...messagesWithCharacterSelection];
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
    return messagesWithCharacterSelection;
  }, [messagesWithCharacterSelection, pageCount, characterFlow.needsCharacterSelection]);

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

  // Send initial prompt from recommendations if provided
  useEffect(() => {
    if (initialPrompt && currentSessionId && messages.length === 0 && !isLoading) {
      setInput(initialPrompt);
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        sendMessage(initialPrompt, undefined, [], {
          outlineReady: false,
          bookCreated: false
        });
      }, 500);
    }
  }, [initialPrompt, currentSessionId, messages.length, isLoading, sendMessage]);

  // Handle edit mode from My Books
  useEffect(() => {
    if (editBookId && sessions && sessions.length > 0 && !currentSessionId) {
      // Find the session linked to this book
      const bookSession = sessions.find(s => s.created_book_id === editBookId);
      
      if (bookSession) {
        // Select the session
        startTransition(() => {
          setCurrentSessionId(bookSession.id);
          setLocalCreatedBookId(editBookId);
          
          // Load editor images and prompts from the session
          if (bookSession.qa_page_images) {
            setEditorPageImages(bookSession.qa_page_images);
          }
          if (bookSession.qa_page_prompts) {
            setEditorPagePrompts(bookSession.qa_page_prompts);
          }
          
          // Auto-open the Book Editor Panel in edit mode
          setCurrentEditorPage(1);
        });
      }
    }
  }, [editBookId, sessions, currentSessionId]);

  // Auto-extract prompts when editor opens in edit mode if prompts are empty
  useEffect(() => {
    if (showEditor && editBookId && selectedSession && messages.length > 0) {
      const hasPrompts = selectedSession.qa_page_prompts && Object.keys(selectedSession.qa_page_prompts).length > 0;
      
      if (!hasPrompts) {
        // Extract prompts from conversation history
        const fullPrompts: Record<number, string> = {};
        const conversationText = messages
          .filter(m => m.role === 'assistant')
          .map(m => m.content)
          .join('\n');
        
        // Extract prompts for each page (A-Z = pages 1-26)
        for (let i = 1; i <= 26; i++) {
          const letter = String.fromCharCode(64 + i);
          const patterns = [
            new RegExp(`<qa_page_${i}>([\\s\\S]*?)</qa_page_${i}>`, 'i'),
            new RegExp(`Page ${i}[:\\s-]+${letter}[:\\s-]+([\\s\\S]*?)(?=Page ${i + 1}|$)`, 'i')
          ];
          
          for (const pattern of patterns) {
            const match = conversationText.match(pattern);
            if (match) {
              fullPrompts[i] = match[1].trim();
              break;
            }
          }
        }
        
        // Save extracted prompts to database
        if (Object.keys(fullPrompts).length > 0) {
          console.log(`[Edit Mode] Extracted ${Object.keys(fullPrompts).length} prompts, saving...`);
          updateQAPagePrompts({ 
            sessionId: currentSessionId, 
            qaPagePrompts: fullPrompts 
          });
          setEditorPagePrompts(fullPrompts);
        }
      }
    }
  }, [showEditor, editBookId, selectedSession, messages, currentSessionId, updateQAPagePrompts]);

  const handleSend = async () => {
    const raw = input.trim();
    if (!raw) return;

    console.log('[Handle Send Debug] Sending message:', {
      sessionId: currentSessionId,
      currentMessageCount: messages.length,
      messageText: raw.substring(0, 50)
    });

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

    // Use refactored hook for theme detection from text
    if (characterFlow.detectThemeFromText(raw)) {
      // Theme was detected - add user message and wait for character selection
      const userMsg = { role: 'user' as const, content: raw };
      const newMessages = [...messages, userMsg];
      queryClient.setQueryData(['session-messages', currentSessionId], newMessages);
      await updateSessionMessages({ sessionId: currentSessionId, messages: newMessages as any });
      setInput('');
      return;
    }

    console.log('[Handle Send Debug] Calling sendMessage with context:', {
      outlineReady: shouldShowReviewButton && !createdBookId,
      bookCreated: !!createdBookId
    });

    await sendMessage(raw, undefined, messages, {
      outlineReady: shouldShowReviewButton && !createdBookId,
      bookCreated: !!createdBookId,
      characterTheme: characterFlow.themeId,
      bookType: selectedBookType,
      selectedCharacterIds: characterFlow.selectedCharacterIds.length > 0 ? characterFlow.selectedCharacterIds : undefined
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
        outlineReady: shouldShowReviewButton && !createdBookId,
        bookCreated: !!createdBookId,
        characterTheme: characterFlow.themeId,
        bookType: selectedBookType
      });
    };
    reader.readAsDataURL(file);
  }, [input, sendMessageWithImage, messages, shouldShowReviewButton, createdBookId, characterFlow.themeId, selectedBookType]);

  // Auto-generate cover prompt for QA panel
  const handleGenerateCoverPrompt = useCallback(async () => {
    // Cover prompt generation removed - images now uploaded from external sources
    console.log('Cover prompt generation skipped - using external image generation');
  }, []);

  const handleBookTypeSelect = useCallback(async (bookType: BookType) => {
    // Store the book type ID for later use  
    setSelectedBookType(bookType.id as BookTypeId);
    
    // Update session name with book type label (silent to avoid toast)
    if (currentSessionId) {
      await updateSessionName({
        sessionId: currentSessionId,
        name: bookType.label,
        silent: true
      });
    }
    
    // Send base prompt - specialized agent handles clarifying questions with [SUGGEST] blocks
    await sendMessage(bookType.prompt, undefined, messages, {
      outlineReady: shouldShowReviewButton && !createdBookId,
      bookCreated: !!createdBookId,
      bookType: bookType.id as BookTypeId
    });
  }, [currentSessionId, sendMessage, updateSessionName, shouldShowReviewButton, createdBookId]);

  const handleCreateBook = useCallback(async () => {
    // Guard 1: No active session
    if (!currentSessionId) {
      console.warn('No active session');
      return;
    }

    // Guard 2: No messages
    if (messages.length === 0) {
      console.warn('Please have a conversation first');
      return;
    }

    // Guard 3: Book already created for this session (prevents duplicates)
    if (createdBookId) {
      console.warn('[Book Creation] Book already exists for this session:', createdBookId);
      return;
    }

    // Guard 4: Creation already in progress
    if (createBookMutation.isPending) {
      console.warn('[Book Creation] Book creation already in progress');
      return;
    }

    const outline = parseBookOutline(messages);
    
    if (outline) {
      console.log(`Extracted ${outline.totalPages} pages from conversation outline`);
    }

    // ✅ CRITICAL: Extract prompts BEFORE book creation if not already extracted
    let promptsToStore = editorPagePrompts;
    
    if (Object.keys(promptsToStore).length === 0) {
      console.log('[Book Creation] No prompts found, extracting from conversation...');
      
      const conversationText = messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join('\n');
      
      // Extract cover prompt (page 1) - Handle both "**Cover:**" and "**Page 1: Cover**" formats
      const coverMatch = conversationText.match(/\*\*(?:Cover:[^\n*]*|Page\s+1:\s*Cover)\*\*\s*([\s\S]*?)(?=\n\*\*(?:Educational Focus:|Page\s+2:)|\n\*\*Page\s+\d+|$)/i);
      
      // Use new helper to extract all prompts with correct page numbers
      const extractedPrompts: Record<number, string> = {};
      
      if (coverMatch) {
        let coverPrompt = coverMatch[0];
        
        // Normalize: Ensure title positioning is explicit
        if (!coverPrompt.toLowerCase().includes('centered') && 
            !coverPrompt.toLowerCase().includes('center')) {
          const titleMatch = conversationText.match(/\*\*(?:Cover:\s*([^*\n]+?)|Page\s+1:\s*Cover)\*\*/i);
          const bookTitle = titleMatch ? (titleMatch[1]?.trim() || '[TITLE]') : '[TITLE]';
          coverPrompt = `${coverPrompt}\n\nCRITICAL INSTRUCTION: Display "${bookTitle}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space.`;
        }
        
        extractedPrompts[1] = coverPrompt;
      }
      
      // Extract educational focus prompt (page 2) - Handle both "**Educational Focus:**" and "**Page 2: Focus**" formats
      const eduMatch = conversationText.match(/\*\*(?:Educational Focus:[^\n*]*|Page\s+2:\s*(?:Educational\s+)?Focus)\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+|$)/i);
      if (eduMatch) {
        extractedPrompts[2] = eduMatch[0];
      }
      
      // Extract all page prompts using the new helper
      const allPrompts = extractPromptsRecord(outline);
      Object.assign(extractedPrompts, allPrompts);
      
      if (Object.keys(extractedPrompts).length > 0) {
        console.log(`[Book Creation] Extracted ${Object.keys(extractedPrompts).length} prompts, saving to session...`);
        
        // Save prompts to session database
        await updateQAPagePrompts({ 
          sessionId: currentSessionId, 
          qaPagePrompts: extractedPrompts 
        });
        
        // Update local state
        setEditorPagePrompts(extractedPrompts);
        promptsToStore = extractedPrompts;
      } else {
        console.warn('[Book Creation] No prompts extracted from conversation');
      }
    } else {
      console.log(`[Book Creation] Using ${Object.keys(promptsToStore).length} existing prompts`);
    }

    // Extract text overlay and style reference
    // Text overlay logic: 
    // - Cover pages can have title text overlays
    // - Content pages (A-Z) never have text overlays (enforced at AI prompt and book creation level)
    const textOverlayPreference = 'without-text'; // Default for content pages
    let referenceBookId: string | undefined;
    
    for (const msg of messages) {
      if (msg.role === 'user' && typeof msg.content === 'string') {
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

    console.log('Creating book in background...');

    try {
      const result = await createBookMutation.mutateAsync({
        conversationHistory: textMessages,
        pageDetails: outline?.contentPages || undefined,
        qaImages: Object.keys(editorPageImages).length > 0 ? editorPageImages : undefined,
        bookType: selectedBookType || undefined,
        characterTheme: characterFlow.themeId || undefined, // Pass validated theme from flow
        targetAge: selectedAgeRange || undefined, // Pass validated age range
        textOverlayPreference,
        referenceBookId,
        targetWords: targetWords.length > 0 ? targetWords : undefined,
        sessionId: currentSessionId, // Include session ID for traceability
        storedPrompts: Object.keys(promptsToStore).length > 0 ? promptsToStore : undefined, // Use extracted prompts
        selectedCharacterIds: characterFlow.selectedCharacterIds.length > 0 ? characterFlow.selectedCharacterIds : undefined, // Pass selected character IDs for enforcement
      });
      
      console.log('[Book Creation] Created book with', Object.keys(promptsToStore).length, 'stored prompts');
      
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
      
      // Update session name with book title (silent to avoid duplicate toast)
      if (bookData && !bookError) {
        await updateSessionName({
          sessionId: currentSessionId,
          name: bookData.book_name,
          silent: true
        });
      }
      
      
      // Keep prompts available for copying after book creation
      // Only clear images (prompts preserved from qa_page_prompts for traceability)
      setEditorPageImages({});
      // NOTE: editorPagePrompts intentionally NOT cleared to preserve original prompts
    } catch (error) {
      console.error('Book creation error:', error);
      // Error toast is handled by the mutation
    }
  }, [currentSessionId, messages, bookOutline, editorPageImages, editorPagePrompts, createBookMutation, linkBookToSession, updateQAPagePrompts, updateSessionName, selectedBookType, characterFlow.themeId, characterFlow.selectedCharacterIds, selectedAgeRange, targetWords, createdBookId]);

  // Create book and wait for result - returns book ID and pages for immediate image generation
  const handleCreateBookAndWait = useCallback(async (): Promise<{ bookId: string; pages: Array<{ id: string; page_number: number }> } | null> => {
    // Guard 1: No active session
    if (!currentSessionId) {
      console.warn('No active session');
      return null;
    }

    // Guard 2: No messages
    if (messages.length === 0) {
      console.warn('Please have a conversation first');
      return null;
    }

    // Guard 3: Book already created for this session
    if (createdBookId) {
      // Book exists, fetch the pages and return
      const { data: existingPages, error } = await supabase
        .from('pages')
        .select('id, page_number')
        .eq('book_id', createdBookId)
        .order('page_number');
      
      if (error || !existingPages) {
        console.error('Failed to fetch existing pages:', error);
        return null;
      }
      
      return { bookId: createdBookId, pages: existingPages };
    }

    // Guard 4: Creation already in progress
    if (createBookMutation.isPending) {
      console.warn('[Book Creation] Book creation already in progress');
      return null;
    }

    const outline = parseBookOutline(messages);

    // Extract prompts if not already extracted
    let promptsToStore = editorPagePrompts;
    
    if (Object.keys(promptsToStore).length === 0) {
      console.log('[Book Creation] No prompts found, extracting from conversation...');
      
      const conversationText = messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join('\n');
      
      const coverMatch = conversationText.match(/\*\*(?:Cover:[^\n*]*|Page\s+1:\s*Cover)\*\*\s*([\s\S]*?)(?=\n\*\*(?:Educational Focus:|Page\s+2:)|\n\*\*Page\s+\d+|$)/i);
      
      const extractedPrompts: Record<number, string> = {};
      
      if (coverMatch) {
        let coverPrompt = coverMatch[0];
        if (!coverPrompt.toLowerCase().includes('centered') && 
            !coverPrompt.toLowerCase().includes('center')) {
          const titleMatch = conversationText.match(/\*\*(?:Cover:\s*([^*\n]+?)|Page\s+1:\s*Cover)\*\*/i);
          const bookTitle = titleMatch ? (titleMatch[1]?.trim() || '[TITLE]') : '[TITLE]';
          coverPrompt = `${coverPrompt}\n\nCRITICAL INSTRUCTION: Display "${bookTitle}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space.`;
        }
        extractedPrompts[1] = coverPrompt;
      }
      
      const eduMatch = conversationText.match(/\*\*(?:Educational Focus:[^\n*]*|Page\s+2:\s*(?:Educational\s+)?Focus)\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+|$)/i);
      if (eduMatch) {
        extractedPrompts[2] = eduMatch[0];
      }
      
      const allPrompts = extractPromptsRecord(outline);
      Object.assign(extractedPrompts, allPrompts);
      
      if (Object.keys(extractedPrompts).length > 0) {
        await updateQAPagePrompts({ 
          sessionId: currentSessionId, 
          qaPagePrompts: extractedPrompts 
        });
        setEditorPagePrompts(extractedPrompts);
        promptsToStore = extractedPrompts;
      }
    }

    const textOverlayPreference = 'without-text';
    let referenceBookId: string | undefined;
    
    for (const msg of messages) {
      if (msg.role === 'user' && typeof msg.content === 'string') {
        const styleMatch = msg.content.match(/style-([a-f0-9-]{36})/i);
        if (styleMatch) {
          referenceBookId = styleMatch[1];
        }
      }
    }

    const textMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : '[Image uploaded]'
    }));

    try {
      const result = await createBookMutation.mutateAsync({
        conversationHistory: textMessages,
        pageDetails: outline?.contentPages || undefined,
        qaImages: Object.keys(editorPageImages).length > 0 ? editorPageImages : undefined,
        bookType: selectedBookType || undefined,
        characterTheme: characterFlow.themeId || undefined,
        targetAge: selectedAgeRange || undefined,
        textOverlayPreference,
        referenceBookId,
        targetWords: targetWords.length > 0 ? targetWords : undefined,
        sessionId: currentSessionId,
        storedPrompts: Object.keys(promptsToStore).length > 0 ? promptsToStore : undefined,
        selectedCharacterIds: characterFlow.selectedCharacterIds.length > 0 ? characterFlow.selectedCharacterIds : undefined,
      });
      
      // Set local book ID immediately
      setLocalCreatedBookId(result.bookId);
      
      // Link book to current session
      await linkBookToSession({ 
        sessionId: currentSessionId, 
        bookId: result.bookId 
      });
      
      // Fetch the book details to update session name
      const { data: bookData } = await supabase
        .from('books')
        .select('book_name')
        .eq('id', result.bookId)
        .single();
      
      if (bookData) {
        await updateSessionName({
          sessionId: currentSessionId,
          name: bookData.book_name,
          silent: true
        });
      }
      
      // Fetch the newly created pages
      const { data: newPages, error: pagesError } = await supabase
        .from('pages')
        .select('id, page_number')
        .eq('book_id', result.bookId)
        .order('page_number');
      
      if (pagesError || !newPages) {
        console.error('Failed to fetch new pages:', pagesError);
        return null;
      }
      
      // Clear editor images but keep prompts
      setEditorPageImages({});
      
      return { bookId: result.bookId, pages: newPages };
    } catch (error) {
      console.error('Book creation error:', error);
      return null;
    }
  }, [currentSessionId, messages, bookOutline, editorPageImages, editorPagePrompts, createBookMutation, linkBookToSession, updateQAPagePrompts, updateSessionName, selectedBookType, characterFlow.themeId, characterFlow.selectedCharacterIds, selectedAgeRange, targetWords, createdBookId]);

  const handleQuickReply = useCallback(async (action: SuggestedAction) => {
    // Handle special actions
    if (action.value === 'open_qa') {
      handleOpenEditorPanel();
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
      // Capture book type if the action ID matches a valid book type
      const validBookTypes = ['abc', 'numbers', 'colors', 'shapes', 'rhyming', 'opposites', 'emotions', 'animals', 'first-words', 'bedtime', 'cvc', 'sight-words'];
      if (validBookTypes.includes(action.id)) {
        console.log('[Book Type Selection] User selected book type:', action.id);
        setSelectedBookType(action.id as BookTypeId);
      }
      
      // Capture character theme if present in the action
      // If theme is selected but no characters yet, DON'T send to AI - wait for CharacterSelector
      if (action.themeId && !action.selectedCharacterIds?.length) {
        console.log('[Theme Selection] User selected theme, waiting for character selection:', action.themeId);
        characterFlow.selectTheme(action.themeId);
        // Don't send message - CharacterSelector will be injected via hook
        return;
      }
      
      // Theme without character selection handled above
      if (action.themeId) {
        characterFlow.selectTheme(action.themeId);
      }
      
      // Capture selected character IDs for enforcement
      if (action.selectedCharacterIds && action.selectedCharacterIds.length > 0) {
        console.log('[Character Selection] User selected characters:', action.selectedCharacterIds);
        characterFlow.confirmSelection(action.selectedCharacterIds);
      }
      
      // Capture age range if present in the action
      if (action.ageRangeId) {
        console.log('[Age Range Selection] User selected age range:', action.ageRangeId);
        setSelectedAgeRange(action.ageRangeId as AgeRangeId);
      }
      
      // Send the predefined response - include newly selected character IDs if present
      const characterIdsToUse = action.selectedCharacterIds?.length > 0 
        ? action.selectedCharacterIds 
        : characterFlow.selectedCharacterIds;
      
      await sendMessage(action.value, undefined, messages, {
        outlineReady: shouldShowReviewButton && !createdBookId,
        bookCreated: !!createdBookId,
        characterTheme: action.themeId || characterFlow.themeId,
        bookType: selectedBookType,
        selectedCharacterIds: characterIdsToUse
      });
    } else {
      // "Custom" option - just focus the input field
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [handleCreateBook, sendMessage, messages, shouldShowReviewButton, createdBookId]);
  // Note: handleOpenEditorPanel, handleViewCreatedBook, handleCreateNewSession are not in deps
  // because they're useCallback functions defined below and are stable

  const handleCreateNewSession = useCallback(async () => {
    try {
      const newSession = await createSession(undefined);
      
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        setCurrentSessionId(newSession.id);
        setCurrentEditorPage(1);
        setEditorPageImages({});
        setEditorPagePrompts({});
        setLocalCreatedBookId(null);
        setOutlineJustCompleted(false);
        setSelectedBookType(null);
        characterFlow.reset(); // Reset theme and character selection
        setSelectedAgeRange(null); // Reset age range selection
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

  const handleOpenEditorPanel = useCallback(async () => {
    // Reset mutation state to allow panel to open after book creation
    createBookMutation.reset();
    
    // Reset force close state to allow editor to open
    setForceEditorClosed(false);
    
    // Extract and store prompts in qa_page_prompts on "View Outline" click
    if (!selectedSession?.qa_page_prompts || Object.keys(selectedSession.qa_page_prompts).length === 0) {
      console.log('[Prompt Storage] Extracting prompts on View Outline click');
      
      // Use new helper to extract prompts - direct page numbers, no offset
      const outline = parseBookOutline(messages);
      const fullPrompts = extractPromptsRecord(outline);
      
      // Add centered title instruction to cover prompt if needed
      if (fullPrompts[1]) {
        let coverPrompt = fullPrompts[1];
        if (!coverPrompt.toLowerCase().includes('centered') && 
            !coverPrompt.toLowerCase().includes('center')) {
          console.log('[Prompt Normalization] Adding centered title instruction to cover prompt');
          
          const bookTitle = bookOutline?.coverPage?.title || '[TITLE]';
          coverPrompt = `${coverPrompt}\n\nCRITICAL INSTRUCTION: Display "${bookTitle}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space.`;
          fullPrompts[1] = coverPrompt;
        }
      }
      
      // Store prompts in session for later use
      if (currentSessionId && Object.keys(fullPrompts).length > 0) {
        console.log('[Prompt Storage] Successfully extracted and storing', Object.keys(fullPrompts).length, 'total prompts');
        await updateQAPagePrompts({ 
          sessionId: currentSessionId, 
          qaPagePrompts: fullPrompts 
        });
        setEditorPagePrompts(fullPrompts);
      } else {
        console.error('[Prompt Storage] FAILED to extract any prompts from conversation');
      }
    } else {
      // Load existing prompts
      console.log('[Prompt Storage] Loading', Object.keys(selectedSession.qa_page_prompts).length, 'existing prompts');
      setEditorPagePrompts(selectedSession.qa_page_prompts);
    }
    
    // Load editor images from current session
    if (selectedSession?.qa_page_images) {
      setEditorPageImages(selectedSession.qa_page_images);
    }
    
    setCurrentEditorPage(1);
  }, [selectedSession, createBookMutation, messages, currentSessionId, updateQAPagePrompts]);

  const handleSelectSession = useCallback((sessionId: string) => {
    if (sessionId !== currentSessionId) {
      // Batch state updates using startTransition
      startTransition(() => {
        setCurrentSessionId(sessionId);
        setCurrentEditorPage(1);
        setLocalCreatedBookId(null);
        setOutlineJustCompleted(false);
        setIsMobileSidebarOpen(false);
        setReplacePageMode({});
        
        // Only reset book type if the session has no created book
        // If it has a created book, useEffect will sync from bookData.metadata
        const session = sessions.find(s => s.id === sessionId);
        if (!session?.created_book_id) {
          setSelectedBookType(null);
        }
        
        // Load editor images and prompts from the selected session
        if (session?.qa_page_images) {
          setEditorPageImages(session.qa_page_images);
        } else {
          setEditorPageImages({});
        }
        if (session?.qa_page_prompts) {
          setEditorPagePrompts(session.qa_page_prompts);
        } else {
          setEditorPagePrompts({});
        }
      });
    }
  }, [currentSessionId, sessions]);

  const handleDeleteSession = useCallback(async (sessionId: string, deleteBook: boolean) => {
    await deleteSession({ sessionId, deleteBook });
    
    // If we deleted the current session, always create a new one immediately
    if (sessionId === currentSessionId) {
      handleCreateNewSession();
    }
  }, [currentSessionId, deleteSession, handleCreateNewSession]);

  const handleRenameSession = useCallback(async (sessionId: string, name: string) => {
    await updateSessionName({ sessionId, name });
  }, [updateSessionName]);

  const handleEditorImageUpload = useCallback(async (imageDataUrl: string, imageMode: 'color' | 'bw' | 'text' = 'color') => {
    // If book is created, update actual page image
    if (createdBookId && dbPages) {
      const currentPage = dbPages.find(p => p.page_number === currentEditorPage);
      if (!currentPage) {
        console.error('Page not found');
        return;
      }

      try {
        console.log('Uploading image in mode:', imageMode);
        
        // OPTIMISTIC UPDATE: Immediately update local state before upload (only for color mode)
        if (imageMode === 'color') {
          setEditorPageImages(prev => ({
            ...prev,
            [currentEditorPage]: imageDataUrl
          }));
          
          // Clear replace mode immediately
          setReplacePageMode(prev => {
            const updated = { ...prev };
            delete updated[currentEditorPage];
            return updated;
          });
          
          // Auto-advance immediately for instant UX (only for color mode)
          if (currentEditorPage < pageCount) {
            setCurrentEditorPage(currentEditorPage + 1);
          }
        }
        
        // Convert base64 to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const modePrefix = imageMode === 'text' ? 'text-' : imageMode === 'bw' ? 'coloring-' : '';
        const fileName = `${modePrefix}page-${currentEditorPage}-${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('page-images')
          .upload(`${user?.id}/${createdBookId}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('page-images')
          .getPublicUrl(uploadData.path);
        
        // For text or bw mode: UPDATE existing record's specific column
        // For color mode: INSERT new version record
        if (imageMode === 'text' || imageMode === 'bw') {
          // Find the latest record for this page
          const { data: latestRecord } = await supabase
            .from('page_image_urls')
            .select('id')
            .eq('page_id', currentPage.id)
            .eq('is_latest', true)
            .single();
          
          if (latestRecord) {
            // Update only the specific column
            const updateColumn = imageMode === 'text' ? 'text_image_url' : 'coloring_image_url';
            const { error: updateError } = await supabase
              .from('page_image_urls')
              .update({ [updateColumn]: publicUrl })
              .eq('id', latestRecord.id);
            
            if (updateError) throw updateError;
          } else {
            // No existing record, create one with the specific URL
            const insertData = {
              page_id: currentPage.id,
              book_id: createdBookId,
              user_id: user?.id,
              version_number: 1,
              source_type: 'user_uploaded' as const,
              is_latest: true,
              text_image_url: imageMode === 'text' ? publicUrl : null,
              coloring_image_url: imageMode === 'bw' ? publicUrl : null,
            };
            
            const { error: insertError } = await supabase
              .from('page_image_urls')
              .insert(insertData);
            
            if (insertError) throw insertError;
          }
          
          // Update the appropriate cache key
          const cacheKey = imageMode === 'text' ? 'book-page-text-images' : 'book-page-coloring-images';
          queryClient.setQueryData([cacheKey, createdBookId], (old: Record<number, string> | undefined) => ({
            ...old,
            [currentEditorPage]: publicUrl
          }));
        } else {
          // Color mode: original behavior - insert new version
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
          
          // Update React Query cache directly instead of invalidating
          queryClient.setQueryData(['book-page-images', createdBookId], (old: Record<number, string> | undefined) => ({
            ...old,
            [currentEditorPage]: publicUrl
          }));
          
          // Update optimistic state with final URL
          setEditorPageImages(prev => ({
            ...prev,
            [currentEditorPage]: publicUrl
          }));
        }
      } catch (error: any) {
        console.error('Image upload error:', error);
        // Rollback optimistic update on error
        setEditorPageImages(prev => {
          const updated = { ...prev };
          delete updated[currentEditorPage];
          return updated;
        });
      }
    } else {
      // Pre-creation: Store in session editor images
      const updatedImages = {
        ...editorPageImages,
        [currentEditorPage]: imageDataUrl
      };
      setEditorPageImages(updatedImages);
      
      // Persist to database
      if (currentSessionId) {
        try {
          await updateQAPageImages({ sessionId: currentSessionId, qaPageImages: updatedImages });
        } catch (error) {
          console.error('Failed to save editor image:', error);
        }
      }
      
      // Auto-advance to next page if not the last page
      if (currentEditorPage < pageCount) {
        setTimeout(() => {
          setCurrentEditorPage(currentEditorPage + 1);
        }, 500);
      } else {
        console.log('All pages reviewed!');
      }
    }
  }, [editorPageImages, currentEditorPage, pageCount, currentSessionId, updateQAPageImages, createdBookId, dbPages, user, queryClient]);

  const handleEditorPageNavigation = useCallback((direction: 'next' | 'prev') => {
    // If book is created, use actual page numbers from database
    if (isBookCreated && dbPages && dbPages.length > 0) {
      const sortedPages = [...dbPages].sort((a, b) => a.page_number - b.page_number);
      const currentIndex = sortedPages.findIndex(p => p.page_number === currentEditorPage);
      
      if (direction === 'next' && currentIndex < sortedPages.length - 1) {
        setCurrentEditorPage(sortedPages[currentIndex + 1].page_number);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentEditorPage(sortedPages[currentIndex - 1].page_number);
      }
      return;
    }
    
    // Pre-creation navigation with educational focus
    const maxPage = bookOutline?.totalPages || 0;
    
    if (direction === 'next' && currentEditorPage < maxPage) {
      setCurrentEditorPage(currentEditorPage + 1);
    } else if (direction === 'prev' && currentEditorPage > 1) {
      setCurrentEditorPage(Math.max(1, currentEditorPage - 1));
    }
  }, [bookOutline, currentEditorPage, isBookCreated, dbPages]);

  const handleRemoveEditorImage = useCallback(async (pageNumber: number) => {
    if (createdBookId) {
      // For created books, just enable replace mode to show upload UI
      setReplacePageMode(prev => ({ ...prev, [pageNumber]: true }));
    } else {
      // For pre-creation, remove from editor images
      const updatedImages = { ...editorPageImages };
      delete updatedImages[pageNumber];
      setEditorPageImages(updatedImages);
      
      if (currentSessionId) {
        try {
          await updateQAPageImages({ sessionId: currentSessionId, qaPageImages: updatedImages });
        } catch (error) {
          console.error('Failed to remove editor image:', error);
        }
      }
    }
  }, [editorPageImages, currentSessionId, updateQAPageImages, createdBookId]);

  // Update page text overlay
  const handleUpdatePageText = useCallback(async (pageNumber: number, newText: string) => {
    console.log('handleUpdatePageText called', { pageNumber, newText, createdBookId, dbPagesLength: dbPages?.length });
    
    if (!createdBookId) {
      console.error('Cannot save: No book ID');
      return;
    }

    if (!dbPages) {
      console.error('Cannot save: Pages data not loaded');
      return;
    }

    const page = dbPages.find(p => p.page_number === pageNumber);
    if (!page) {
      console.error('Page not found:', pageNumber, 'Available pages:', dbPages.map(p => p.page_number));
      return;
    }
    
    console.log('Updating page:', page.id, 'with text:', newText);
    
    try {
      // Update the page title (single source of truth)
      const { error } = await supabase
        .from('pages')
        .update({ 
          title: newText,
          updated_at: new Date().toISOString()
        })
        .eq('id', page.id);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Text saved successfully');
      
      // Regenerate word metadata from new title to keep word carousel in sync
      try {
        await generateMetadata({
          pageId: page.id,
          bookId: createdBookId,
          title: newText,
          currentContent: page.content || {}
        });
        console.log('✅ Word metadata regenerated');
      } catch (metadataError) {
        console.error('Failed to regenerate word metadata:', metadataError);
      }
      
      // Invalidate queries to refresh
      await queryClient.invalidateQueries({ queryKey: ['book-pages', createdBookId] });
    } catch (error) {
      console.error('Error updating text:', error);
    }
  }, [createdBookId, dbPages, queryClient, generateMetadata]);

  // Toggle book status between draft and published
  const handleToggleBookStatus = useCallback(async () => {
    if (!createdBookId) {
      console.error('Book not ready');
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

  // Extract page text overlays from database pages (using title as single source)
  const pageTextOverlays = useMemo(() => {
    if (!dbPages) return {};
    
    return dbPages.reduce((acc, page) => ({
      ...acc,
      [page.page_number]: page.title
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
        .eq('page_type', 'cover')
        .single();
      
      if (!error && data) {
        setCoverPageId(data.id);
      }
    };
    
    fetchCoverPage();
  }, [createdBookId]);

  // Handle thumbnail image upload (uploads to cover page)
  const handleThumbnailUpload = useCallback(async (file: File) => {
    if (!createdBookId) {
      console.error('Book not created yet');
      return;
    }
    
    try {
      console.log('Uploading cover image...');
      
      // 1. Ensure cover page exists
      const { data: existingPage } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', createdBookId)
        .eq('page_type', 'cover')
        .maybeSingle();
      
      let coverPageId: string;
      
      if (!existingPage) {
        // Create cover page if it doesn't exist
        const { data: newPage, error: createError } = await supabase
          .from('pages')
          .insert({
            book_id: createdBookId,
            page_number: 0,
            letter: 'Cover',
            page_identifier: 'Cover',
            title: 'Cover',
            page_type: 'cover',
            content: {}
          })
          .select()
          .single();
        
        if (createError || !newPage) throw createError || new Error('Failed to create cover page');
        coverPageId = newPage.id;
      } else {
        coverPageId = existingPage.id;
      }
      
      // 2. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(`${user?.id}/${createdBookId}/cover-${Date.now()}.png`, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('page-images')
        .getPublicUrl(uploadData.path);
      
      // 4. Get next version number
      const { data: existingImages } = await supabase
        .from('page_image_urls')
        .select('version_number')
        .eq('page_id', coverPageId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = (existingImages?.[0]?.version_number || 0) + 1;
      
      // 5. Mark all previous versions as not latest
      await supabase
        .from('page_image_urls')
        .update({ is_latest: false })
        .eq('page_id', coverPageId);
      
      // 6. Insert new image record
      const { error: insertError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: coverPageId,
          book_id: createdBookId,
          user_id: user?.id,
          version_number: nextVersion,
          image_url: publicUrl,
          source_type: 'user_uploaded',
          is_latest: true,
        });
      
      if (insertError) throw insertError;
      
      // 7. Optimistically update cache with new cover URL for instant UI feedback
      queryClient.setQueryData(['book-cover-image', createdBookId], publicUrl);
      
      // 8. Invalidate queries for consistency
      await queryClient.invalidateQueries({ queryKey: ['book-cover-image', createdBookId] });
      await queryClient.invalidateQueries({ queryKey: ['book-cover-page', createdBookId] });
      await queryClient.invalidateQueries({ queryKey: ['book-page-images', createdBookId] });
      await queryClient.invalidateQueries({ queryKey: ['books', user?.id] });
      
      setThumbnailUrl(publicUrl);
      
      // Auto-navigate to next page after successful cover upload
      if (currentEditorPage === 1 && pageCount > 1) {
        setCurrentEditorPage(2);
      }
      
      console.log('Cover image uploaded successfully!');
    } catch (error: any) {
      console.error('Cover upload error:', error);
    }
  }, [createdBookId, user, queryClient, currentEditorPage, pageCount]);

  // Fetch thumbnail URL from cover page
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!createdBookId) {
      setThumbnailUrl(null);
      return;
    }
    
    const fetchCoverImage = async () => {
      const { data, error } = await supabase
        .from('page_image_urls')
        .select(`
          image_url,
          pages!inner(page_type)
        `)
        .eq('book_id', createdBookId)
        .eq('pages.page_type', 'cover')
        .eq('is_latest', true)
        .maybeSingle();
      
      if (!error && data?.image_url) {
        setThumbnailUrl(data.image_url);
      }
    };
    
    fetchCoverImage();
  }, [createdBookId]);

  return (
    <AdminOnly showMessage={true}>
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
            hasMore={hasMore}
            onLoadMore={loadMore}
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
                hasMore={hasMore}
                onLoadMore={loadMore}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Chat Area - Adjusts width for desktop side panel */}
        <div className={cn(
          "flex-1 flex flex-col w-full transition-all duration-300",
          !isMobile && showEditor && !createBookMutation.isSuccess && "mr-[400px]"
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
                        lift spinning...
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
            shouldShowReviewButton={shouldShowReviewButton || isBookPublished}
            selectedKidId={selectedKidId}
            onInputChange={setInput}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
            onImageUploadToggle={setShowImageUpload}
            onImageSelect={handleImageSelect}
            onViewBook={handleViewCreatedBook}
            onOpenReview={handleOpenEditorPanel}
            onKidChange={setSelectedKidId}
          />
        </div>


        {/* Book Editor Panel - Responsive: Bottom Sheet on Mobile, Sliding Div on Desktop */}
        {isMobile && showEditor && !createBookMutation.isSuccess && (
          <Sheet 
            open={true} 
            onOpenChange={(open) => {
              if (!open) setForceEditorClosed(true);
            }}
          >
            <SheetContent 
              side="bottom" 
              className="w-full max-h-[90vh] p-0 overflow-hidden rounded-t-xl z-[100]"
            >
              <BookEditorPanel
                showEditor={true}
                isBookCreated={isBookCreated}
                createdBookId={createdBookId}
                currentPageNumber={currentEditorPage}
                pageCount={pageCount}
                displayImages={displayImages}
                editorPageImages={editorPageImages}
                getCurrentPagePrompt={getCurrentPagePrompt}
                getCurrentPageTitle={getCurrentPageTitle}
                createBookMutation={createBookMutation}
                onClose={() => setForceEditorClosed(true)}
                onNavigate={handleEditorPageNavigation}
                onImageUpload={handleEditorImageUpload}
                onRemoveImage={handleRemoveEditorImage}
                onCreateBook={handleCreateBook}
                onCreateBookAndWait={handleCreateBookAndWait}
                coverPageId={coverPageId}
                bookId={createdBookId}
                onCoverUpload={handleThumbnailUpload}
                thumbnailUrl={thumbnailUrl}
                pageTextOverlays={pageTextOverlays}
                onUpdatePageText={handleUpdatePageText}
                onToggleStatus={handleToggleBookStatus}
                isPublishing={updateBookStatusMutation.isPending}
                bookStatus={(bookData?.status as PublicationStatus) || PublicationStatus.DRAFT}
                bookTitle={bookData?.book_name}
                bookDescription={bookData?.book_description || undefined}
                characterTheme={(bookData?.metadata as any)?.characterTheme}
              />
            </SheetContent>
          </Sheet>
        )}
        {!isMobile && (
          <div
            className={cn(
              "fixed right-0 top-[3.5rem] bottom-0 w-[400px] bg-background border-l shadow-lg z-[100]",
              "transition-transform duration-300 ease-out",
              showEditor && !createBookMutation.isSuccess
                ? "translate-x-0"
                : "translate-x-full"
            )}
          >
            <BookEditorPanel
              showEditor={true}
              isBookCreated={isBookCreated}
              createdBookId={createdBookId}
              currentPageNumber={currentEditorPage}
              pageCount={pageCount}
              displayImages={displayImages}
              editorPageImages={editorPageImages}
              getCurrentPagePrompt={getCurrentPagePrompt}
              getCurrentPageTitle={getCurrentPageTitle}
              createBookMutation={createBookMutation}
              onClose={() => setForceEditorClosed(true)}
              onNavigate={handleEditorPageNavigation}
              onImageUpload={handleEditorImageUpload}
              onRemoveImage={handleRemoveEditorImage}
              onCreateBook={handleCreateBook}
              onCreateBookAndWait={handleCreateBookAndWait}
              coverPageId={coverPageId}
              bookId={createdBookId}
                onCoverUpload={handleThumbnailUpload}
                thumbnailUrl={thumbnailUrl}
                pageTextOverlays={pageTextOverlays}
                onUpdatePageText={handleUpdatePageText}
                onToggleStatus={handleToggleBookStatus}
                isPublishing={updateBookStatusMutation.isPending}
                bookStatus={(bookData?.status as PublicationStatus) || PublicationStatus.DRAFT}
                bookTitle={bookData?.book_name}
                bookDescription={bookData?.book_description || undefined}
                characterTheme={(bookData?.metadata as any)?.characterTheme}
            />
          </div>
        )}
      </div>
    </PageLayout>
    </AdminOnly>
  );
}
