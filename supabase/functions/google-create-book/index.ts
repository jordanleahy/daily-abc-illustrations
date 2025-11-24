import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { stripHexCodes } from '../_shared/templateProcessor.ts';
import { normalizeBookType, normalizeAgeRange, validateNumberRange, ValidBookType, ValidAgeRange, BOOK_TYPE_TO_AGENT_TYPE, AgentType } from '../_shared/types.ts';
import { SPECIALIZED_AGENT_PROMPTS } from './specialized-agent-prompts.ts';

const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

const pageDetailSchema = z.object({
  pageNumber: z.number().int().positive().max(100),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000)
});

const requestSchema = z.object({
  conversationHistory: z.array(conversationMessageSchema),
  userId: z.string().uuid(),
  pageDetails: z.array(pageDetailSchema).optional(),
  qaImages: z.record(z.string()).optional(),
  bookType: z.string().optional(),
  characterTheme: z.string().optional(), // Validated character theme from enum
  targetAge: z.string().optional(), // Target age range
  textOverlayPreference: z.enum(['with-text', 'without-text']).optional(),
  referenceBookId: z.string().uuid().optional(),
  fullPrompts: z.record(z.string()).optional(), // Full image prompts by page number
  targetWords: z.array(z.string()).optional(), // Target words for word learning recommendations
  sessionId: z.string().uuid().optional(), // Chat session ID for traceability
  educationalFocus: z.object({
    targetAge: z.string(),
    learningType: z.string(),
    specificSkill: z.string(),
    imagePrompt: z.string()
  }).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    const { conversationHistory, userId, pageDetails, qaImages, bookType: rawBookType, characterTheme, targetAge: rawTargetAge, textOverlayPreference, referenceBookId, educationalFocus, fullPrompts, targetWords, sessionId } = validatedData;
    
    // Normalize and validate book type
    const bookType = normalizeBookType(rawBookType);
    console.log(`[Book Creation] Raw book type: ${rawBookType}, Normalized: ${bookType}`);
    
    // Normalize and validate target age
    const targetAge = normalizeAgeRange(rawTargetAge);
    console.log(`[Book Creation] Raw target age: ${rawTargetAge}, Normalized: ${targetAge}`);
    
    // Sanitization utility
    const sanitizeText = (text: string, maxLength: number): string => {
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
        .replace(/[^\w\s.,!?'"#-]/g, '') // Allow # for hex codes
        .substring(0, maxLength)
        .trim();
    };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'AI service not configured' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating book using Lovable AI for user:', userId);
    console.log('Book type specified:', bookType);

    // Fetch style guide if referenceBookId is provided
    let styleGuide: string | null = null;
    if (referenceBookId) {
      console.log('Fetching style guide from reference book:', referenceBookId);
      
      const { data: refBook } = await supabase
        .from('books')
        .select('book_name, book_description, category, metadata')
        .eq('id', referenceBookId)
        .single();

      if (refBook) {
        const { data: refPages } = await supabase
          .from('pages')
          .select('title, description')
          .eq('book_id', referenceBookId)
          .order('page_number')
          .limit(3);

        const { data: stylePrompt } = await supabase
          .from('book_system_prompts')
          .select('content')
          .eq('book_id', referenceBookId)
          .eq('is_latest', true)
          .single();

        // Build comprehensive style guide from reference book
        styleGuide = `VISUAL STYLE REFERENCE (maintain this exact style):

Book: ${refBook.book_name}
Category: ${refBook.category}

Style Description:
${refBook.book_description || 'Educational children\'s book style'}

${stylePrompt ? `\nDetailed Style Guide:\n${stylePrompt.content}` : ''}

${refPages && refPages.length > 0 ? `\nExample Pages:\n${refPages.map((p, i) => `${i + 1}. ${p.title}: ${p.description}`).join('\n')}` : ''}

CRITICAL: Maintain consistent visual style, character appearance (if applicable), color palette, art approach, and atmosphere throughout all pages.`;
        
        console.log('Style guide generated, length:', styleGuide.length);
      }
    }

    // Color extraction utility function
    const extractColorFromTitle = (title: string): string | null => {
      // Match pattern like "**Red:**" or "**Blue:**"
      const boldColorPattern = /^\*\*([A-Za-z]+):\*\*/;
      const match = title.match(boldColorPattern);
      
      if (match) {
        return match[1].toLowerCase();
      }
      
      // Fallback: Check if title starts with a color word
      const commonColors = [
        'red', 'orange', 'yellow', 'green', 'blue', 'purple', 
        'pink', 'brown', 'black', 'white', 'gray', 'grey', 
        'violet', 'indigo', 'cyan', 'magenta', 'turquoise'
      ];
      
      const titleLower = title.toLowerCase();
      for (const color of commonColors) {
        if (titleLower.startsWith(color)) {
          return color;
        }
      }
      
      return null;
    };

    // ============================================================================
    // ORCHESTRATION: Agent Selection Based on Book Type
    // ============================================================================
    console.log('[Orchestration] Starting agent selection for book type:', bookType);

    // Map book type to agent type
    const agentType: AgentType = BOOK_TYPE_TO_AGENT_TYPE[bookType || 'other'] || 'book-creation';
    console.log('[Orchestration] Mapped to agent type:', agentType);

    // Attempt to fetch specialized agent
    let selectedAgent: any = null;
    let agentSource = 'none';

    // Try specialized agent first (if not generic)
    if (agentType !== 'book-creation') {
      const { data: specializedAgent, error: specializedError } = await supabase
        .from('agents')
        .select('*')
        .eq('type', agentType)
        .eq('is_latest', true)
        .maybeSingle();
      
      if (specializedAgent && !specializedError) {
        selectedAgent = specializedAgent;
        agentSource = 'specialized';
        console.log('[Orchestration] ✓ Using specialized agent:', specializedAgent.name, 'version:', specializedAgent.version);
      } else {
        console.log('[Orchestration] ⚠ Specialized agent not found, falling back to generic');
      }
    }

    // Fallback to generic book-creation agent
    if (!selectedAgent) {
      const { data: genericAgent, error: genericError } = await supabase
        .from('agents')
        .select('*')
        .eq('type', 'book-creation')
        .eq('is_latest', true)
        .maybeSingle();
      
      if (genericAgent && !genericError) {
        selectedAgent = genericAgent;
        agentSource = 'generic-fallback';
        console.log('[Orchestration] ✓ Using generic agent:', genericAgent.name);
      } else {
        console.error('[Orchestration] ✗ No agents found! Aborting.');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'No book creation agent configured. Please set up agents in the admin panel.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Track agent usage for learning (async, non-blocking)
    const metricsInsert = await supabase
      .from('agent_performance_metrics')
      .insert({
        agent_id: selectedAgent.id,
        agent_type: selectedAgent.type,
        metadata_captured: {
          bookType,
          targetAge,
          characterTheme,
          agentSource,
          sessionId
        }
      })
      .select('id')
      .single();

    const performanceMetricId = metricsInsert.data?.id;
    if (metricsInsert.error) {
      console.error('[Learning] Failed to create performance metric:', metricsInsert.error);
    } else {
      console.log('[Learning] Created performance metric:', performanceMetricId);
    }

    // Use the selected agent's instructions as system prompt
    let systemPrompt = selectedAgent.instructions;
    let promptSource = 'database';
    
    // CRITICAL: Check if database has placeholder prompt (< 500 chars)
    // If so, use full prompt from specialized-agent-prompts.ts file instead
    const MIN_PROMPT_LENGTH = 500;
    if (systemPrompt.length < MIN_PROMPT_LENGTH) {
      console.warn(`[Prompt Validation] Database prompt is suspiciously short (${systemPrompt.length} chars). Checking for file-based fallback...`);
      
      // Try to map agent type to specialized prompt
      const filePrompt = SPECIALIZED_AGENT_PROMPTS[bookType as keyof typeof SPECIALIZED_AGENT_PROMPTS];
      if (filePrompt) {
        console.log(`[Prompt Fallback] ✓ Using full prompt from specialized-agent-prompts.ts for ${bookType} (${filePrompt.length} chars)`);
        systemPrompt = filePrompt;
        promptSource = 'file-fallback';
      } else {
        console.warn(`[Prompt Fallback] ✗ No file-based prompt found for book type: ${bookType}. Using short database prompt.`);
        promptSource = 'database-short';
      }
    }
    
    console.log('[Orchestration] Agent selected:', {
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      agentType: selectedAgent.type,
      version: selectedAgent.version,
      source: agentSource,
      promptLength: systemPrompt.length,
      promptSource: promptSource
    });

    // ============================================================================
    // Prepare prompt for book creation
    // ============================================================================
    
    if (pageDetails && pageDetails.length > 0) {
      // User provided structured page details - append them to the agent's base instructions
      console.log(`Using ${pageDetails.length} pre-defined page details from chat`);
      
      systemPrompt += `

CRITICAL INSTRUCTIONS FOR THIS REQUEST:
- The user has already designed specific pages in our conversation
- You MUST use the exact page titles and descriptions provided below
- You MUST include pageType field for EVERY page
- Cover page is ALWAYS pageNumber: 0, pageType: "cover"
- Educational focus (if present) is ALWAYS pageNumber: 1, pageType: "educational"
- Content pages start at pageNumber: 2, pageType: "content"
- Do NOT include aspect ratio specs in titles/descriptions
- NEVER use quotes or apostrophes in titles (plain text only)
- EXTRACT metadata from the conversation

PROVIDED PAGE STRUCTURE:
${pageDetails.map(p => `Page ${p.pageNumber}: ${p.title}\n${p.description}`).join('\n\n')}

Return ONLY valid JSON with this structure:
{
  "bookName": "string",
  "category": "string", 
  "bookDescription": "string",
  "metadata": {
    "bookType": "${bookType}",
    "pageCount": ${pageDetails.length},
    "letterCase": "lowercase|uppercase|both (for ABC content)",
    "numberRange": "1-10 (for Numbers content)",
    "countingStyle": "simple|skip-counting (for Numbers content)",
    "characterTheme": "${characterTheme || 'not-specified'}", 
    "targetAge": "toddler|preschool|early-reader"
  },
  "pages": [
    {
      "pageNumber": 0,
      "pageType": "cover",
      "letter": "COVER",
      "title": "Book Title",
      "description": "Cover description with title-focused layout",
      "content": {
        "mainConcept": "Book title",
        "funFact": "Book description",
        "activity": ""
      }
    },
    {
      "pageNumber": 1,
      "pageType": "educational",
      "letter": "FOCUS",
      "title": "Educational Focus",
      "description": "Age and learning objectives",
      "content": {
        "mainConcept": "Target age",
        "funFact": "Learning approach",
        "activity": "Specific skills"
      }
    },
    {
      "pageNumber": 2,
      "pageType": "content",
      "letter": "a (or appropriate - WITHOUT parentheses in this field)",
      "title": "EXACT TITLE FROM PROVIDED LIST - FOR ABC: use format '(a) is for apple'",
      "description": "EXACT DESCRIPTION FROM PROVIDED LIST",
      "content": {
        "mainConcept": "string",
        "funFact": "string",
        "activity": "string"${bookType === 'colors' ? ',\n        "color": "string"' : ''}
      }
    }
  ]
}`;
    }

    // Add targetWords instructions if provided (from word learning recommendations)
    if (targetWords && targetWords.length > 0) {
      systemPrompt += `

IMPORTANT - WORD LEARNING FOCUS:
- This book is being created to help practice specific challenging words: ${targetWords.join(', ')}
- Naturally incorporate these words throughout the appropriate pages
- For ABC books: Use target words that start with each letter when possible
- Make the book engaging and fun while focusing on vocabulary practice
- Examples should highlight these words in meaningful contexts
- Target words: [${targetWords.join(', ')}]
`;
      console.log(`Target words for vocabulary practice: ${targetWords.join(', ')}`);
    }

    const prompt = `Based on this conversation, create a complete children's book:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Return ONLY valid JSON, no other text, no markdown code blocks.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    console.log('Calling Lovable AI to generate book structure');

    // Call Lovable AI Gateway using selected agent's model settings
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedAgent.model || 'google/gemini-2.5-flash',
        max_completion_tokens: selectedAgent.max_completion_tokens || 8000,
        top_p: selectedAgent.top_p || 0.95,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Rate limit exceeded. Please try again later.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Payment required. Please add credits to your Lovable AI workspace.' 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'AI service error', 
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('Lovable AI response received, length:', content.length);
    
    // Clean up response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Cleaned content:', content.substring(0, 200));

    // Parse JSON
    const bookData = JSON.parse(content);

    // Validate book data structure
    if (!bookData.bookName || !bookData.pages || !Array.isArray(bookData.pages)) {
      throw new Error('Invalid book data structure from AI response');
    }

    // If this is a color book, ensure colors are extracted
    if (bookType === 'colors' && bookData.pages) {
      const extractedColors: string[] = [];
      
      bookData.pages.forEach((page: any) => {
        // If AI didn't include color, try to extract it
        if (!page.content?.color) {
          const extractedColor = extractColorFromTitle(page.title);
          if (extractedColor) {
            if (!page.content) page.content = {};
            page.content.color = extractedColor;
            extractedColors.push(extractedColor);
          }
        } else {
          extractedColors.push(page.content.color);
        }
      });
      
      // Add color metadata to book-level metadata
      if (!bookData.metadata) bookData.metadata = {};
      bookData.metadata.colorsList = [...new Set(extractedColors)]; // Unique colors
      bookData.metadata.colorsCount = extractedColors.length;
      
      console.log(`Extracted ${extractedColors.length} colors for color book:`, bookData.metadata.colorsList);
    }

    // Determine showTextOverlay flag
    // CRITICAL: Content pages should never have text overlays
    // Only cover pages can have title text overlays
    const showTextOverlay = textOverlayPreference !== 'without-text';

    // Extract and validate metadata
    const metadata = bookData.metadata || {};
    const validatedMetadata = {
      bookType: normalizeBookType(metadata.bookType || bookData.bookType) || bookType,
      pageCount: bookData.pages.length,
      targetAge: normalizeAgeRange(metadata.targetAge) || targetAge,
      letterCase: metadata.letterCase || bookData.letterCase,
      numberRange: validateNumberRange(metadata.numberRange),
      countingStyle: metadata.countingStyle,
      shapeComplexity: metadata.shapeComplexity,
      shapeTheme: metadata.shapeTheme,
      animalCategory: metadata.animalCategory,
      animalFocus: metadata.animalFocus,
      readingLevel: metadata.readingLevel,
      characterTheme: characterTheme || metadata.characterTheme, // Prioritize validated theme from frontend
      styleGuideKey: (characterTheme || metadata.characterTheme) === 'bear-stories' ? 'bear-stories' : undefined,
      colorsList: metadata.colorsList,
      colorsCount: metadata.colorsCount,
      showTextOverlay: showTextOverlay,
      customOptions: {}
    };

    console.log('Extracted metadata:', validatedMetadata);

    console.log(`Creating book: ${bookData.bookName} with ${bookData.pages.length} pages`);
    
    // Validate against provided page details if they exist
    if (pageDetails && pageDetails.length > 0) {
      if (bookData.pages.length !== pageDetails.length) {
        console.warn(`Page count mismatch: expected ${pageDetails.length}, got ${bookData.pages.length}`);
      }
      
      // Verify titles match
      for (let i = 0; i < pageDetails.length; i++) {
        const provided = pageDetails[i];
        const aiPage = bookData.pages.find((p: any) => p.pageNumber === provided.pageNumber);
        
        if (!aiPage) {
          console.warn(`Page ${provided.pageNumber} not found in AI response`);
          continue;
        }
        
        if (aiPage.title !== provided.title) {
          console.warn(`Title mismatch on page ${provided.pageNumber}: "${provided.title}" vs "${aiPage.title}"`);
        }
      }
    }
    
    // Sanitize all page data before database insertion
    // CRITICAL: Regular content pages should NOT have text overlays by default
    const sanitizedPages = bookData.pages.map((page: any) => ({
      ...page,
      letter: sanitizeText(page.letter || '', 10),
      title: sanitizeText(page.title, 100),
      description: sanitizeText(page.description || '', 2000), // Increased for detailed Bear Stories prompts
      content: {
        mainConcept: sanitizeText(page.content?.mainConcept || '', 500),
        funFact: sanitizeText(page.content?.funFact || '', 500),
        activity: sanitizeText(page.content?.activity || '', 500),
        textOverlay: {
          enabled: showTextOverlay, // Use user preference
          text: sanitizeText(page.title, 100),
          position: 'bottom-center' as const,
          createdAt: new Date().toISOString()
        }
      }
    }));

    // Insert book with sanitized data and metadata
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: sanitizeText(bookData.bookName, 200),
        category: sanitizeText(bookData.category || 'General', 100),
        book_description: sanitizeText(bookData.bookDescription || '', 1000),
        total_pages: sanitizedPages.length + 1,
        status: 'draft',
        reference_book_id: referenceBookId || null,
        chat_session_id: sessionId || null, // Link to chat session for traceability
        metadata: { 
          ...validatedMetadata, 
          hasStyleGuide: !!styleGuide,
          // Track which agent created this book for learning
          createdByAgentId: selectedAgent.id,
          createdByAgentType: selectedAgent.type,
          createdByAgentVersion: selectedAgent.version,
          agentSource: agentSource
        }
      })
      .select()
      .single();

    if (bookError || !book) {
      console.error('Error creating book:', bookError);
      throw new Error('Failed to create book');
    }

    console.log('Book created with ID:', book.id);

    // Store educational focus in books table if provided
    if (educationalFocus) {
      const { error: eduFocusError } = await supabase
        .from('books')
        .update({
          educational_focus: educationalFocus
        })
        .eq('id', book.id);
        
      if (eduFocusError) {
        console.error('Error storing educational focus:', eduFocusError);
      } else {
        console.log('Educational focus stored in books table');
      }
    }

    // Process pages from AI response with explicit page types
    // AI returns: pageNumber 0=cover, 1=educational (optional), 2+=content
    // We store as: page_number 1, 2, 3... but preserve the page_type
    
    const pages = sanitizedPages.map((page: any, index: number) => {
      const pageType = page.pageType || 'content'; // Default to content if not specified
      const actualPageNumber = index + 1; // Database page numbers start at 1
      
      // Determine text overlay behavior based on page type
      let textOverlayEnabled = false;
      if (pageType === 'cover' || pageType === 'educational') {
        textOverlayEnabled = true; // Cover and educational pages ALWAYS have text
      } else {
        textOverlayEnabled = showTextOverlay; // Content pages use user preference
      }
      
      return {
        book_id: book.id,
        page_type: pageType,
        letter: sanitizeText(page.letter || `Page ${actualPageNumber}`, 10),
        page_number: actualPageNumber,
        title: sanitizeText(page.title, 100),
        description: sanitizeText(page.description || '', 500),
        content: {
          mainConcept: sanitizeText(page.content?.mainConcept || '', 500),
          funFact: sanitizeText(page.content?.funFact || '', 500),
          activity: sanitizeText(page.content?.activity || '', 500),
          imagePrompt: fullPrompts?.[actualPageNumber] || '', // Use full prompt if available from session
          textOverlay: {
            enabled: textOverlayEnabled,
            text: sanitizeText(page.title, 100),
            position: 'bottom-center' as const,
            createdAt: new Date().toISOString()
          }
        }
      };
    });

    console.log(`Inserting ${pages.length} pages: ${pages.filter((p: any) => p.page_type === 'cover').length} cover, ${pages.filter((p: any) => p.page_type === 'educational').length} educational, ${pages.filter((p: any) => p.page_type === 'content').length} content`);

    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pages);

    if (pagesError) {
      console.error('Error creating pages:', pagesError);
      // Try to clean up the book
      await supabase.from('books').delete().eq('id', book.id);
      throw new Error('Failed to create pages');
    }

    const coverCount = pages.filter((p: any) => p.page_type === 'cover').length;
    const eduCount = pages.filter((p: any) => p.page_type === 'educational').length;
    const contentCount = pages.filter((p: any) => p.page_type === 'content').length;
    console.log(`Successfully created ${pages.length} pages: ${coverCount} cover, ${eduCount} educational, ${contentCount} content`);

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * PAGE SYSTEM PROMPT GENERATION - TWO-PATH STRATEGY
     * ═══════════════════════════════════════════════════════════════════════════
     * 
     * This section handles page-specific image generation prompts using one of two paths:
     * 
     * PATH 1: PRESERVE FULL CHAT PROMPTS (Preferred)
     * ────────────────────────────────────────────────
     * When the frontend provides `fullPrompts` from the chat session:
     * - These are the COMPLETE, untruncated prompts from the AI conversation
     * - They contain rich detail, style guides, character descriptions, and scene context
     * - Example length: 500-1500+ characters per prompt
     * - They are stored EXACTLY as provided - NO TRUNCATION, NO MODIFICATION
     * - Source type: 'chat_generated' for tracking
     * 
     * CRITICAL: Do NOT regenerate or shorten these prompts. They represent the full
     * creative vision from the chat session and must be preserved byte-for-byte.
     * 
     * PATH 2: GENERATE NEW PROMPTS (Fallback)
     * ────────────────────────────────────────
     * When no fullPrompts are provided:
     * - Calls generate-page-system-prompts edge function
     * - Creates shorter, template-based prompts from page metadata
     * - Example length: 100-300 characters per prompt
     * - Source type: 'template_generated' for tracking
     * 
     * WHY THIS MATTERS:
     * ────────────────
     * Users reported copied prompts being cut off. Investigation showed that when
     * books were created from chat, the detailed prompts were being regenerated
     * (shortened) instead of preserved. This fix ensures the full chat prompts
     * are stored and accessible for:
     * - Copying to external AI image generators
     * - Editing and refining prompts
     * - Maintaining creative consistency
     * - Historical reference
     * 
     * SECURITY & VALIDATION:
     * ─────────────────────
     * - Input sanitization happens upstream in request validation (Zod schema)
     * - Maximum prompt length: Text field (no DB limit, but validated upstream)
     * - XSS protection: Prompts are stored as plain text, not executed
     * - Access control: RLS policies on page_system_prompts table
     * 
     * MONITORING & DEBUGGING:
     * ──────────────────────
     * - Logs which path was taken (fullPrompts vs generated)
     * - Counts successful prompt insertions
     * - Logs errors without failing book creation
     * - Track source_type field for analytics
     * ═══════════════════════════════════════════════════════════════════════════
     */
    
    if (fullPrompts && Object.keys(fullPrompts).length > 0) {
      // PATH 1: Use full prompts from chat session
      const promptKeys = Object.keys(fullPrompts);
      console.log(`[PROMPT PRESERVATION] Using ${promptKeys.length} full prompts from chat session`);
      console.log(`[PROMPT PRESERVATION] Book: ${book.book_name} (${book.id})`);
      
      // Get created pages with their IDs
      const { data: createdPages, error: fetchPagesError } = await supabase
        .from('pages')
        .select('id, page_number, title')
        .eq('book_id', book.id)
        .order('page_number');
      
      if (fetchPagesError) {
        console.error('[PROMPT PRESERVATION ERROR] Failed to fetch pages:', fetchPagesError);
        console.warn('[PROMPT PRESERVATION] Falling back to prompt generation');
        
        // Fall through to PATH 2 below
      } else if (!createdPages || createdPages.length === 0) {
        console.error('[PROMPT PRESERVATION ERROR] No pages found for book');
      } else {
        let promptsCreated = 0;
        let promptsSkipped = 0;
        let totalPromptLength = 0;
        const promptMetrics: any[] = [];
        
        console.log(`[PROMPT PRESERVATION] Matching ${promptKeys.length} prompts to ${createdPages.length} pages`);
        
        for (const [pageNumStr, promptContent] of Object.entries(fullPrompts)) {
          const pageNumber = parseInt(pageNumStr, 10);
          
          // Validate page number
          if (isNaN(pageNumber)) {
            console.warn(`[PROMPT PRESERVATION] Invalid page number: "${pageNumStr}" - skipping`);
            promptsSkipped++;
            continue;
          }
          
          // Find matching page
          const page = createdPages.find((p: any) => p.page_number === pageNumber);
          if (!page) {
            console.warn(`[PROMPT PRESERVATION] Page ${pageNumber} not found (title: ${promptContent.substring(0, 50)}...)`);
            promptsSkipped++;
            continue;
          }
          
          // Validate prompt content
          if (!promptContent || typeof promptContent !== 'string') {
            console.warn(`[PROMPT PRESERVATION] Invalid prompt content for page ${pageNumber} - skipping`);
            promptsSkipped++;
            continue;
          }
          
          const trimmedContent = promptContent.trim();
          if (trimmedContent.length === 0) {
            console.warn(`[PROMPT PRESERVATION] Empty prompt for page ${pageNumber} - skipping`);
            promptsSkipped++;
            continue;
          }
          
          // Log prompt metrics for monitoring
          totalPromptLength += trimmedContent.length;
          promptMetrics.push({
            page: pageNumber,
            title: page.title,
            length: trimmedContent.length
          });
          
          try {
            // Get next version number for this page
            const { data: versionData, error: versionError } = await supabase
              .rpc('get_next_page_prompt_version_number', { p_page_id: page.id });
            
            if (versionError) {
              console.error(`[PROMPT PRESERVATION ERROR] Failed to get version for page ${pageNumber}:`, versionError);
              promptsSkipped++;
              continue;
            }
            
            const versionNumber = versionData || 1;
            
            // Insert the full prompt from chat - EXACTLY AS PROVIDED
            const { error: insertError } = await supabase
              .from('page_system_prompts')
              .insert({
                page_id: page.id,
                book_id: book.id,
                user_id: userId,
                version_number: versionNumber,
                content: trimmedContent, // Store full prompt with no modifications
                is_latest: true,
                is_deployed: true,
                deployed_at: new Date().toISOString(),
                source_type: 'chat_generated', // Track that this came from chat
                prompt_status: 'complete',
                generation_metadata: {
                  preservedFromChat: true,
                  originalLength: trimmedContent.length,
                  timestamp: new Date().toISOString()
                }
              });
            
            if (insertError) {
              console.error(`[PROMPT PRESERVATION ERROR] Failed to insert prompt for page ${pageNumber}:`, insertError);
              promptsSkipped++;
            } else {
              promptsCreated++;
              console.log(`[PROMPT PRESERVATION] ✓ Page ${pageNumber} (${page.title}): ${trimmedContent.length} chars`);
            }
          } catch (error) {
            console.error(`[PROMPT PRESERVATION ERROR] Exception processing page ${pageNumber}:`, error);
            promptsSkipped++;
          }
        }
        
        // Log comprehensive metrics
        const avgLength = promptsCreated > 0 ? Math.round(totalPromptLength / promptsCreated) : 0;
        console.log(`[PROMPT PRESERVATION COMPLETE]`);
        console.log(`  ✓ Created: ${promptsCreated}`);
        console.log(`  ✗ Skipped: ${promptsSkipped}`);
        console.log(`  📏 Avg length: ${avgLength} chars`);
        console.log(`  📊 Total: ${totalPromptLength} chars`);
        
        if (promptMetrics.length > 0) {
          const shortest = promptMetrics.reduce((min, p) => p.length < min.length ? p : min);
          const longest = promptMetrics.reduce((max, p) => p.length > max.length ? p : max);
          console.log(`  📉 Shortest: Page ${shortest.page} (${shortest.length} chars)`);
          console.log(`  📈 Longest: Page ${longest.page} (${longest.length} chars)`);
        }
        
        // If we didn't create any prompts, fall back to generation
        if (promptsCreated === 0) {
          console.warn('[PROMPT PRESERVATION] No prompts were created - falling back to generation');
          // Fall through to PATH 2 below
        } else {
          // Success - skip PATH 2
          console.log('[PROMPT PRESERVATION] ✅ Using preserved prompts from chat');
        }
      }
    }
    
    // PATH 2: Generate new prompts if needed
    // Only runs if:
    // 1. No fullPrompts were provided, OR
    // 2. PATH 1 failed completely (0 prompts created)
    if (!fullPrompts || Object.keys(fullPrompts).length === 0) {
      console.log('[PROMPT GENERATION] No full prompts provided - generating from page data');
      
      try {
        const { data: promptsData, error: promptsError } = await supabase.functions.invoke(
          'generate-page-system-prompts',
          {
            body: { bookId: book.id }
          }
        );

        if (promptsError) {
          console.error('[PROMPT GENERATION ERROR] Failed to generate prompts:', promptsError);
          // Don't fail book creation - prompts can be regenerated later via UI
        } else if (promptsData) {
          console.log(`[PROMPT GENERATION] ✓ Generated ${promptsData.promptsCreated || 0} prompts for ${promptsData.totalPages || 0} pages`);
        }
      } catch (error) {
        console.error('[PROMPT GENERATION ERROR] Exception during generation:', error);
        // Continue - book is created successfully, prompts can be regenerated later
      }
    }

    // Create default style guide for the book
    const defaultStyleGuide = `You are an AI specialized in creating vibrant, educational children's book illustrations.

**Core Design Principles:**
- **Style**: Bright, cheerful, and engaging illustrations with bold colors
- **Composition**: Clear focal points, simple backgrounds, and age-appropriate detail
- **Color Palette**: Primary and secondary colors with high contrast for visual appeal
- **Safety**: All content must be child-safe, positive, and educational

**Illustration Requirements:**
1. Create a single, clear focal point that represents the main concept
2. Use simple, recognizable shapes and forms
3. Include educational elements that support the learning objective
4. Maintain consistency with the book's overall theme
5. Ensure backgrounds enhance but don't distract from the main subject

**Technical Specifications:**
- Square format (1:1 aspect ratio)
- High contrast and clarity for young readers
- Child-friendly, positive imagery only

**TEXT OVERLAY POLICY:**
- **Cover pages**: Text overlay ENABLED - Include space for title text at bottom center
- **Educational focus pages**: Text overlay ENABLED - Include space for descriptive text
- **Regular content pages (A-Z, numbers, etc.)**: Text overlay DISABLED - No text space needed, image fills entire frame

Create an illustration that brings the page content to life while maintaining these guidelines.`;

    // Get version number for the style guide
    const { data: versionData, error: versionError } = await supabase
      .rpc('get_next_version_number', { p_book_id: book.id });

    if (versionError) {
      console.error('Error getting version number:', versionError);
    } else {
      const versionNumber = versionData || 1;

      // Insert the style guide and mark it as deployed
      const { error: styleGuideError } = await supabase
        .from('book_system_prompts')
        .insert({
          book_id: book.id,
          user_id: userId,
          version_number: versionNumber,
          content: defaultStyleGuide,
          is_latest: true,
          is_deployed: true,
          deployed_at: new Date().toISOString()
        });

      if (styleGuideError) {
        console.error('Error creating style guide:', styleGuideError);
      } else {
        console.log('Created and deployed default style guide');
      }
    }

    // Phase 0.6: No longer auto-creating draft daily_published entries
    // Users must explicitly schedule books for publication via UI


    // Process QA images if provided
    if (qaImages && Object.keys(qaImages).length > 0) {
      console.log(`Processing ${Object.keys(qaImages).length} QA images`);
      
      // First get all created pages with their IDs
      const { data: createdPages, error: fetchPagesError } = await supabase
        .from('pages')
        .select('id, page_number')
        .eq('book_id', book.id);
      
      if (fetchPagesError || !createdPages) {
        console.error('Error fetching pages for QA images:', fetchPagesError);
      } else {
        for (const [pageNumStr, imageDataUrl] of Object.entries(qaImages)) {
          const pageNumber = parseInt(pageNumStr, 10);
          const page = createdPages.find((p: any) => p.page_number === pageNumber);
          
          if (!page) {
            console.warn(`Page ${pageNumber} not found for QA image upload`);
            continue;
          }
          
          try {
            // Extract base64 data from data URL
            const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!base64Match) {
              console.error(`Invalid image data URL for page ${pageNumber}`);
              continue;
            }
            
            const [, extension, base64Data] = base64Match;
            
            // Decode base64 to binary
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Upload to Supabase Storage
            const fileName = `${book.id}/${page.id}/qa-upload-v1.${extension}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('page-images')
              .upload(fileName, bytes, {
                contentType: `image/${extension}`,
                upsert: false
              });
            
            if (uploadError) {
              console.error(`Failed to upload QA image for page ${pageNumber}:`, uploadError);
              continue;
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('page-images')
              .getPublicUrl(fileName);
            
            // Create page_image_urls record
            const { error: imageUrlError } = await supabase
              .from('page_image_urls')
              .insert({
                page_id: page.id,
                book_id: book.id,
                user_id: userId,
                version_number: 1,
                image_url: publicUrl,
                generation_status: 'complete',
                generation_completed_at: new Date().toISOString(),
                prompt_used: `User uploaded from Book Editor Panel for page ${pageNumber}`,
                is_latest: true,
                source_type: 'user_uploaded'
              });
            
            if (imageUrlError) {
              console.error(`Failed to create image URL record for page ${pageNumber}:`, imageUrlError);
            } else {
              console.log(`Book Editor image uploaded for page ${pageNumber}`);
            }
            
          } catch (error) {
            console.error(`Error processing QA image for page ${pageNumber}:`, error);
          }
        }
      }
    }

    // Trigger SEO generation asynchronously
    supabase.functions.invoke('generate-seo-metadata', {
      body: { bookId: book.id }
    }).catch(err => console.error('Failed to trigger SEO generation:', err));

    // Update performance tracking with book completion (async, non-blocking)
    if (performanceMetricId) {
      await supabase
        .from('agent_performance_metrics')
        .update({ 
          book_id: book.id,
          book_created: true,
          total_pages: pages.length,
          completed_at: new Date().toISOString(),
          metadata_captured: {
            bookType,
            targetAge,
            characterTheme,
            agentSource,
            sessionId,
            pageCount: pages.length
          }
        })
        .eq('id', performanceMetricId)
        .then(({ error }) => {
          if (error) console.error('[Learning] Failed to update performance metric:', error);
          else console.log('[Learning] Updated performance metric with book ID:', book.id);
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        bookId: book.id,
        message: `Book "${bookData.bookName}" created successfully with ${pages.length} pages!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-create-book function:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request data',
          details: error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
