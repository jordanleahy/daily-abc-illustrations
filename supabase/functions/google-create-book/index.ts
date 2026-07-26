import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { stripHexCodes } from '../_shared/templateProcessor.ts';
import { normalizeBookType, normalizeAgeRange, validateNumberRange, ValidBookType, ValidAgeRange } from '../_shared/types.ts';
import { 
  selectAgent, 
  createPerformanceMetric, 
  logOrchestration,
  type AgentRecord
} from '../_shared/agentOrchestration.ts';
import { getSelectedCharacterConstraints } from '../_shared/styleGuides.ts';
import { getResortVisualPrompt, isValidLocation, initLocationsCache, type ValidLocation } from '../_shared/locations.ts';
import { getCityVisualPromptSync, isValidCity, initCitiesCache, resolveCityToken, getCityGroundTruthPromptAsync, type ValidCity } from '../_shared/cities.ts';
import { resolveSavedBookName, buildFlatCoverImagePrompt, enforceCoverPageTitle } from '../_shared/coverPromptConstants.ts';
import { outlineToBook, type OutlinePageInput } from './outlineToBook.ts';

const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

const pageDetailSchema = z.object({
  pageNumber: z.number().int().positive().max(100),
  title: z.string().min(1).max(100),
  description: z.string().min(1)
});

const requestSchema = z.object({
  conversationHistory: z.array(conversationMessageSchema),
  // userId is now extracted from JWT token, not from request body
  pageDetails: z.array(pageDetailSchema).optional(),
  qaImages: z.record(z.string()).optional(),
  bookType: z.string().optional(),
  characterTheme: z.string().optional(), // Validated character theme from enum
  targetAge: z.string().optional(), // Target age range (legacy)
  gradeLevel: z.string().optional(), // Target grade level (preferred)
  textOverlayPreference: z.enum(['with-text', 'without-text']).optional(),
  referenceBookId: z.string().uuid().optional(),
  fullPrompts: z.record(z.string()).optional(), // Full image prompts by page number
  targetWords: z.array(z.string()).optional(), // Target words for word learning recommendations
  sessionId: z.string().uuid().optional(), // Chat session ID for traceability
  selectedCharacterIds: z.array(z.string()).optional(), // IDs of selected characters for enforcement
  // Discovery attributes for marketing hashtags
  season: z.string().optional(),
  environment: z.string().optional(),
  clothingBrand: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  // Manners-specific discovery attributes
  mannerType: z.string().optional(),
  mannersSetting: z.string().optional(),
  educationalFocus: z.object({
    targetAge: z.string(),
    learningType: z.string(),
    specificSkill: z.string(),
    imagePrompt: z.string()
  }).optional(),
  // NEW: full outline shortcut. When present, we skip the second LLM call and
  // deterministically adapt the outline into BookDataSchema via outlineToBook.
  bookOutline: z.object({
    bookName: z.string().min(1),
    bookDescription: z.string().optional(),
    category: z.string().optional(),
    pages: z.array(z.object({
      pageNumber: z.number().int().positive().max(100),
      pageType: z.enum(['cover', 'educational', 'content']).optional(),
      title: z.string().min(1).max(200),
      description: z.string().optional().default('')
    })).min(1)
  }).optional()
});

// Zod schema for book data validation
const PageContentSchema = z.object({
  mainConcept: z.string().optional().default(''),
  funFact: z.string().optional().default(''),
  activity: z.string().optional().default(''),
  color: z.string().optional()
});

const PageSchema = z.object({
  pageNumber: z.number(),
  pageType: z.enum(['cover', 'educational', 'content']),
  letter: z.string().optional(), // Optional for non-ABC book types (manners, emotions, etc.)
  title: z.string().min(1, 'Page title is required'),
  description: z.string().min(1, 'Page description is required'),
  content: PageContentSchema,
  imagePrompt: z.string().optional() // Image prompt may be included in AI response
});

const BookDataSchema = z.object({
  bookName: z.string().min(1, 'Book name is required'),
  category: z.string().optional(),
  bookDescription: z.string().optional(),
  metadata: z.object({
    bookType: z.string().optional().nullable(),
    pageCount: z.number().optional().nullable(),
    letterCase: z.string().optional().nullable(),
    characterTheme: z.string().optional().nullable(),
    targetAge: z.string().optional().nullable(),
    gradeLevel: z.string().optional().nullable(), // Target grade level (e.g., 'PRE_K', 'K')
    numberRange: z.string().optional().nullable(),
    countingStyle: z.string().optional().nullable(),
    shapeComplexity: z.string().optional().nullable(),
    shapeTheme: z.string().optional().nullable(),
    animalCategory: z.string().optional().nullable(),
    animalFocus: z.string().optional().nullable(),
    readingLevel: z.string().optional().nullable(),
    colorsList: z.array(z.string()).optional().nullable(),
    colorsCount: z.number().optional().nullable()
  }).optional(),
  pages: z.array(PageSchema).min(1, 'At least one page is required')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing authorization header' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client with service role for user verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and extract user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid authentication token' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id; // Extract userId from verified JWT

    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    const { conversationHistory, pageDetails, qaImages, bookType: rawBookType, characterTheme, targetAge: rawTargetAge, gradeLevel: rawGradeLevel, textOverlayPreference, referenceBookId, educationalFocus, fullPrompts, targetWords, sessionId, selectedCharacterIds, season, environment, clothingBrand, location, city, mannerType, mannersSetting, bookOutline } = validatedData;
    
    // Normalize and validate book type
    const bookType = normalizeBookType(rawBookType);
    console.log(`[Book Creation] Raw book type: ${rawBookType}, Normalized: ${bookType}`);
    
    // Normalize and validate target age (legacy)
    const targetAge = normalizeAgeRange(rawTargetAge);
    console.log(`[Book Creation] Raw target age: ${rawTargetAge}, Normalized: ${targetAge}`);
    
    // Validate grade level (preferred)
    const { isValidGrade, ValidGrade } = await import('../_shared/gradeLevels.ts');
    const gradeLevel: string | undefined = rawGradeLevel && isValidGrade(rawGradeLevel) 
      ? rawGradeLevel 
      : undefined;
    console.log(`[Book Creation] Raw grade level: ${rawGradeLevel}, Validated: ${gradeLevel}`);

    // Initialize caches from database
    await initLocationsCache();
    await initCitiesCache(supabase);

    // Resolve raw city token (e.g. "CITY_NEW_YORK_CITY", "CITY_CUSTOM:Paris")
    // into a human label ONCE. Everything downstream (cover prompt, book title,
    // metadata) uses cityLabel. The raw `city` id is only kept for the city
    // visual-profile lookup, which is keyed by id.
    const cityLabel = resolveCityToken(city);
    if (city && !cityLabel) {
      console.warn(`[City Resolution] Could not resolve city token "${city}" to a human label — cover title will omit it.`);
    } else if (cityLabel) {
      console.log(`[City Resolution] "${city}" → "${cityLabel}"`);
    }

    // Sanitization utility
    const sanitizeText = (text: string, maxLength: number): string => {
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
        .replace(/[^\w\s.,!?'"#-]/g, '') // Allow # for hex codes
        .substring(0, maxLength)
        .trim();
    };

    // Supabase client already initialized above for auth verification

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
    
    // Import validation utilities
    const { validateABCBookStructure, sanitizeUserInput, retryWithBackoff } = await import('../_shared/validation.ts');

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
    // ORCHESTRATION: Agent Selection via Shared Utility
    // ============================================================================
    const { agent: selectedAgent, source: agentSource, agentType, error: agentError } = await selectAgent(supabase, {
      bookType,
      requireAgent: true,
      minPromptLength: 500
    });

    // Handle agent selection failure
    if (agentError || !selectedAgent) {
      console.error('[Orchestration] ✗ Agent selection failed:', agentError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: agentError || 'No book creation agent configured. Please set up agents in the admin panel.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track agent usage for learning via shared utility (async, non-blocking)
    const performanceMetricId = await createPerformanceMetric(supabase, {
      agentId: selectedAgent.id,
      agentType: selectedAgent.type,
      agentSource,
      bookType,
      targetAge,
      characterTheme,
      sessionId
    });

    // Log orchestration details. The agent is still resolved for provenance
    // metadata (createdByAgentId/Type/Version), but its instructions are NOT
    // re-sent to an LLM here: book structure now comes from the approved chat
    // outline via `outlineToBook`, so no system prompt is composed on this path.
    logOrchestration({
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      agentType: selectedAgent.type,
      version: selectedAgent.version,
      source: agentSource,
      promptLength: 0,
      promptSource: 'deterministic-outline'
    });




    // ========================================================================
    // DETERMINISTIC ONLY: outline → BookDataSchema adapter.
    // The client always sends the approved `bookOutline`, so there is no second
    // LLM call here. This removes schema-drift bugs ("title" vs "bookName",
    // "page_number" vs "pageNumber") that used to make "Create My Book" fail
    // silently, and removes ~3–15s of latency from the hot path.
    // ========================================================================
    if (!bookOutline) {
      console.error('[Adapter] OUTLINE_REQUIRED — request arrived without bookOutline');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OUTLINE_REQUIRED',
          details: 'A book outline is required. Please regenerate the outline in chat and try again.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let bookData: z.infer<typeof BookDataSchema>;

    console.log('[Adapter] bookOutline provided — building book deterministically');
    try {
      const adapted = outlineToBook({
        bookName: bookOutline.bookName,
        bookDescription: bookOutline.bookDescription,
        category: bookOutline.category,
        bookType: bookType,
        gradeLevel: gradeLevel,
        targetAge: targetAge,
        pages: bookOutline.pages as OutlinePageInput[],
      });

      bookData = BookDataSchema.parse(adapted);
      console.log(`[Adapter] ✓ Built bookData deterministically: ${bookData.bookName} (${bookData.pages.length} pages)`);
    } catch (err) {
      console.error('[Adapter] ✗ Failed to adapt outline:', err);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Book outline could not be converted into a book',
          details: err instanceof Error ? err.message : String(err),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }




    // HARDENING: ABC-specific validation
    if (bookType === 'abc' && bookData.pages) {
      console.log('[ABC Validation] Running comprehensive structure validation...');
      
      // Extract letter case from metadata
      const letterCase = bookData.metadata?.letterCase || 'lowercase';
      
      // Validate complete ABC structure
      const { validateABCBookStructure } = await import('../_shared/validation.ts');
      const validation = validateABCBookStructure(bookData.pages, letterCase);
      
      if (!validation.valid) {
        console.error('[ABC Validation] Structure validation failed:', validation.errors);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'ABC book validation failed',
            details: validation.errors.join('; ')
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[ABC Validation] ✓ All validations passed - 28 pages, proper format, complete alphabet');
    }

    // HARDENING: Non-ABC book validation (12-page structure)
    // Uses the shared unified validator instead of an inlined copy of the rules.
    if (bookType && bookType !== 'abc' && bookType !== 'other' && bookData.pages) {
      console.log(`[${bookType.toUpperCase()} Validation] Running 12-page structure validation...`);

      const { validateBookStructure } = await import('../_shared/validation.ts');
      const { valid, errors, warnings } = validateBookStructure(bookData.pages, bookType);

      if (warnings.length > 0) {
        console.warn(`[${bookType.toUpperCase()} Validation] Warnings:`, warnings);
      }

      if (!valid) {
        console.error(`[${bookType.toUpperCase()} Validation] Structure validation failed:`, errors);

        return new Response(
          JSON.stringify({
            success: false,
            error: `${bookType} book validation failed`,
            details: errors.join('; ')
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      
      console.log(`[${bookType.toUpperCase()} Validation] ✓ All validations passed - 12 pages, proper format (1 cover + 1 education + 10 content)`);
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
      bookType: normalizeBookType(metadata.bookType) || bookType,
      pageCount: bookData.pages.length,
      targetAge: normalizeAgeRange(metadata.targetAge) || targetAge,
      gradeLevel: gradeLevel || metadata.gradeLevel || undefined, // Preferred over targetAge
      letterCase: metadata.letterCase,
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

    // Resolve the final book title once so cover row + book row stay in sync.
    const resolvedBookName = sanitizeText(
      resolveSavedBookName(bookData.bookName, {
        bookType: bookType || 'abc',
        gradeLevel,
        season,
        city: cityLabel ?? undefined, // resolved human label — never a "CITY_*" token
        resort: location,
        characterTheme,
        selectedCharacterIds,
      }),
      200
    );

    // Insert book with sanitized data and metadata
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: resolvedBookName,

        category: sanitizeText(bookData.category || 'General', 100),
        book_description: sanitizeText(bookData.bookDescription || '', 1000),
        total_pages: sanitizedPages.length,
        status: 'draft',
        reference_book_id: referenceBookId || null,
        chat_session_id: sessionId || null, // Link to chat session for traceability
        metadata: { 
          ...validatedMetadata, 
          hasStyleGuide: !!styleGuide,
          selectedCharacterIds: selectedCharacterIds || [], // Store selected characters for image regeneration
          // Track which agent created this book for learning
          createdByAgentId: selectedAgent.id,
          createdByAgentType: selectedAgent.type,
          createdByAgentVersion: selectedAgent.version,
          agentSource: agentSource,
          // Discovery attributes for marketing hashtags
          season: season || null,
          environment: environment || null,
          clothingBrand: clothingBrand || null,
          location: location || null,
          city: city || null,
          cityLabel: cityLabel || null,
          // Manners-specific discovery attributes
          mannerType: mannerType || null,
          mannersSetting: mannersSetting || null
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
    // AI returns 1-based page numbering: pageNumber 1=cover, 2=educational (optional), 3+=content
    // We store using page.pageNumber directly (already 1-based)
    
    const pages = sanitizedPages.map((page: any) => {
      const pageType = page.pageType || 'content'; // Default to content if not specified
      const actualPageNumber = page.pageNumber; // Use AI-provided 1-based page number directly
      const isCover = pageType === 'cover';

      // Determine text overlay behavior based on page type.
      // POLICY: cover pages NEVER show a text overlay.
      let textOverlayEnabled = false;
      if (isCover) {
        textOverlayEnabled = false;
      } else if (pageType === 'educational') {
        textOverlayEnabled = true; // Educational pages always show text
      } else {
        textOverlayEnabled = showTextOverlay; // Content pages use user preference
      }

      // Cover image prompts MUST route through the flat-illustration wrapper
      // so the model never renders a physical book and never bakes in any text.
      const rawPrompt = fullPrompts?.[actualPageNumber] || '';
      const imagePrompt = isCover ? buildFlatCoverImagePrompt(rawPrompt) : rawPrompt;

      const row = {
        book_id: book.id,
        page_type: pageType,
        letter: sanitizeText(page.letter || `Page ${actualPageNumber}`, 10),
        page_identifier: sanitizeText(page.letter || `Page ${actualPageNumber}`, 50),
        page_number: actualPageNumber,
        title: sanitizeText(page.title, 100),
        description: sanitizeText(page.description || '', 500),
        content: {
          mainConcept: sanitizeText(page.content?.mainConcept || '', 500),
          funFact: sanitizeText(page.content?.funFact || '', 500),
          activity: sanitizeText(page.content?.activity || '', 500),
          imagePrompt,
          textOverlay: {
            enabled: textOverlayEnabled,
            text: sanitizeText(page.title, 100),
            position: 'bottom-center' as const,
            createdAt: new Date().toISOString()
          }
        }
      };

      // Cover row keeps the resolved book title on `title` for accessibility /
      // admin listings, but `textOverlay.enabled` stays false (enforced inside).
      return isCover ? enforceCoverPageTitle(row, resolvedBookName) : row;

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

        // PERF: build all rows first, resolve version numbers in parallel, then
        // do ONE batch insert. Previously this ran 2 sequential roundtrips per
        // page (up to 56 for a 28-page ABC book) inside a request timeout.
        const candidates: Array<{ pageNumber: number; pageId: string; pageTitle: string; content: string }> = [];

        for (const [pageNumStr, promptContent] of Object.entries(fullPrompts)) {
          const pageNumber = parseInt(pageNumStr, 10);

          if (isNaN(pageNumber)) {
            console.warn(`[PROMPT PRESERVATION] Invalid page number: "${pageNumStr}" - skipping`);
            promptsSkipped++;
            continue;
          }

          const page = createdPages.find((p: any) => p.page_number === pageNumber);
          if (!page) {
            console.warn(`[PROMPT PRESERVATION] Page ${pageNumber} not found`);
            promptsSkipped++;
            continue;
          }

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

          totalPromptLength += trimmedContent.length;
          promptMetrics.push({ page: pageNumber, title: page.title, length: trimmedContent.length });
          candidates.push({
            pageNumber,
            pageId: page.id,
            pageTitle: page.title,
            content: trimmedContent,
          });
        }

        if (candidates.length > 0) {
          const versionResults = await Promise.all(
            candidates.map(async (c) => {
              const { data, error } = await supabase
                .rpc('get_next_page_prompt_version_number', { p_page_id: c.pageId });
              if (error) {
                console.error(`[PROMPT PRESERVATION ERROR] Version lookup failed for page ${c.pageNumber}:`, error);
                return null;
              }
              return { ...c, versionNumber: data || 1 };
            })
          );

          const now = new Date().toISOString();
          const rows = versionResults
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .map((r) => ({
              page_id: r.pageId,
              book_id: book.id,
              user_id: userId,
              version_number: r.versionNumber,
              content: r.content, // Store full prompt with no modifications
              is_latest: true,
              is_deployed: true,
              deployed_at: now,
              source_type: 'chat_generated',
              prompt_status: 'complete',
              generation_metadata: {
                preservedFromChat: true,
                originalLength: r.content.length,
                timestamp: now,
              },
            }));

          promptsSkipped += candidates.length - rows.length;

          if (rows.length > 0) {
            const { error: insertError } = await supabase
              .from('page_system_prompts')
              .insert(rows);

            if (insertError) {
              console.error('[PROMPT PRESERVATION ERROR] Batch insert failed:', insertError);
              promptsSkipped += rows.length;
            } else {
              promptsCreated = rows.length;
              console.log(`[PROMPT PRESERVATION] ✓ Batch inserted ${rows.length} prompts`);
            }
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
