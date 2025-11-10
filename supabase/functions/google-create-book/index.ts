import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

const pageDetailSchema = z.object({
  pageNumber: z.number().int().positive().max(100),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000)
});

const requestSchema = z.object({
  conversationHistory: z.array(conversationMessageSchema),
  userId: z.string().uuid(),
  pageDetails: z.array(pageDetailSchema).optional(),
  qaImages: z.record(z.string()).optional(),
  bookType: z.string().optional(),
  textOverlayPreference: z.enum(['with-text', 'without-text']).optional(),
  referenceBookId: z.string().uuid().optional(),
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
    const { conversationHistory, userId, pageDetails, qaImages, bookType, textOverlayPreference, referenceBookId, educationalFocus } = validatedData;
    
    // Sanitization utility
    const sanitizeText = (text: string, maxLength: number): string => {
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
        .replace(/[^\w\s.,!?'"-]/g, '') // Only safe characters
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
    if (bookType) {
      console.log('Book type specified:', bookType);
    }

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

    // Prepare prompt for book creation
    let systemPrompt = '';
    
    if (pageDetails && pageDetails.length > 0) {
      // User provided structured page details - AI must use them
      console.log(`Using ${pageDetails.length} pre-defined page details from chat`);
      
      systemPrompt = `You are an expert at creating children's educational cover images and page content. The user has already designed specific pages in our conversation.

CRITICAL INSTRUCTIONS: 
- You MUST use the exact page titles and descriptions provided below. Do NOT change them.
- Do NOT include aspect ratio specifications (like "1:1", "16:9", etc.) in any titles or descriptions
- Aspect ratios are handled separately by the image generation tool
- EXTRACT metadata from the conversation (content type, page count, character theme, etc.)

COVER PAGE GUIDELINES:
If pageNumber 0 is included (the cover), ensure the description follows this title-focused format:
- Title should be described as "large, bold, centered" taking up "50-60% of the space"
- Background should be described as "vibrant [color] background" or "gentle [color]-to-[color] gradient"
- Decorative elements should be described as "small [items] around edges and corners"
- Use "cover image" NOT "book cover"
- Overall composition should be "clean, simple, and optimized for thumbnail visibility"

PROVIDED PAGE STRUCTURE:
${pageDetails.map(p => `Page ${p.pageNumber}: "${p.title}"\n${p.description}`).join('\n\n')}

Your task:
1. Create a bookName (creative title that encompasses all pages)
2. Choose a category (alphabet, numbers, emotions, animals, etc.)
3. Write a bookDescription (2-3 sentences about the complete content)
4. For each page, maintain the exact title and description provided
5. Add content fields (mainConcept, funFact, activity) for each page
6. Assign appropriate letters for alphabet content (A-Z pattern)
7. Extract and return metadata from conversation

Return ONLY valid JSON with this structure:
{
  "bookName": "string",
  "category": "string", 
  "bookDescription": "string",
  "metadata": {
    "bookType": "abc|numbers|shapes|colors|animals|etc",
    "pageCount": ${pageDetails.length},
    "letterCase": "lowercase|uppercase|both (for ABC content)",
    "numberRange": "1-10 (for Numbers content)",
    "countingStyle": "simple|skip-counting (for Numbers content)",
    "characterTheme": "paw-patrol|dinosaurs|space|etc (if mentioned)",
    "targetAge": "toddler|preschool|early-reader"
  },
  "pages": [
    {
      "pageNumber": number,
      "letter": "string",
      "title": "EXACT TITLE FROM PROVIDED LIST",
      "description": "EXACT DESCRIPTION FROM PROVIDED LIST",
      "content": {
        "mainConcept": "string",
        "funFact": "string",
        "activity": "string"${bookType === 'colors' ? ',\n        "color": "string (extracted color name for color content)"' : ''}
      }
    }
  ]
}`;
    } else {
      // No structured details - use original full AI generation prompt
      systemPrompt = `You are an expert at creating children's educational content and cover images.
Based on the conversation, determine the most appropriate format and create a complete content structure.

Content Types:
- "alphabet": ABC learning content with 26 pages (A-Z), each page teaching a letter
  * For alphabet content, check if user specified letter case:
    - "lowercase" or "lowercase letters": use a, b, c... format
    - "uppercase" or "uppercase letters": use A, B, C... format
    - "both" or "both cases": use Aa, Bb, Cc... format
    - Default to uppercase (A, B, C...) if not specified
- "story": Narrative story content with 8-16 pages telling a cohesive story
- "educational": Topic-based learning content with 10-20 pages covering different aspects
- "chapter": Longer content with 15-26 pages divided into chapters

IMPORTANT: 
- Do NOT include aspect ratio specifications (like "1:1", "16:9", etc.) in page titles or descriptions
- Aspect ratios are handled separately by the image generation tool
- For NON-alphabet content, do NOT include "letter" fields
- For alphabet content, include "letter" field with values matching the specified case format
- Adjust page count based on content type and complexity
- Make content age-appropriate and engaging
- EXTRACT and RETURN metadata from the conversation (content type, page count preferences, themes, etc.)

COVER PAGE DESIGN GUIDELINES:
When creating the cover description (pageNumber: 0), use this format for thumbnail-optimized, title-focused covers:

"A vibrant educational cover image with [TITLE] displayed in large, bold, centered letters taking up 50-60% of the space. The background features [simple solid color or gentle gradient]. Around the edges and corners are [4-8 small themed decorative elements]. The design is clean, simple, and optimized for thumbnail visibility."

Cover Description Rules:
1. Title Placement: Always mention "large, bold, centered" and "taking up 50-60% of the space"
2. Background: Describe as "vibrant [color] background" or "gentle [color]-to-[color] gradient" - keep it SIMPLE
   - Good: "sunny yellow-to-turquoise gradient background"
   - Good: "bright coral solid background"
   - Bad: "detailed park scene with trees and playground equipment"
3. Decorative Elements: Describe 4-8 SMALL items "around the edges and corners"
   - Should relate to the theme (ABC letters, numbers, themed icons, character elements)
   - Place around borders/corners ONLY, not competing with center title space
4. Character Theme Integration: If character theme mentioned (Paw Patrol, Peppa Pig, etc.):
   - Include small character icons or themed elements around edges
   - Do NOT make characters the main focal point
   - Example: "small Paw Patrol character faces in the corners"
5. Overall Composition: Always describe as "clean, simple, and optimized for thumbnail visibility"

Cover Examples:

ABC Content Cover:
"A vibrant educational cover image with 'ABC ADVENTURE' displayed in large, bold, centered white letters with colorful outlines, taking up the center 60% of the space. The background features a cheerful yellow-to-turquoise gradient. Around the edges and corners are small alphabet blocks, letter tiles, and simple A, B, C graphics scattered playfully. The design is clean, simple, and optimized for thumbnail visibility."

Character Theme (Paw Patrol) Cover:
"A vibrant educational cover image with 'PAW PATROL LEARNING FUN' displayed in large, bold, centered white letters with blue outlines, taking up the center 50% of the space. The background features a bright sky blue gradient. Around the edges and corners are small Paw Patrol character faces, paw prints, and badge icons scattered playfully. The design is clean, simple, and optimized for thumbnail visibility."

Kitchen/Food Theme Cover:
"A vibrant educational cover image with 'KITCHEN ABCS' displayed in large, bold, centered white letters with colored outlines, taking up the center 55% of the space. The background features a warm peach-to-cream gradient. Around the edges and corners are small cooking utensils, fruit icons, and kitchen items scattered playfully. The design is clean, simple, and optimized for thumbnail visibility."

What NOT to Do for Covers:
- Do NOT describe detailed scenes (no "park with swings and slides")
- Do NOT describe characters as the main focus
- Do NOT describe complex backgrounds
- Do NOT place decorative elements in the center competing with title
- Do NOT describe layouts that won't read well as thumbnails

METADATA EXTRACTION:
Analyze the conversation for:
1. Content type selected (ABC, Numbers, Shapes, Animals, Sight Words, etc.)
2. Number of pages requested (5, 10, 15, 20, custom, or "let agent decide")
3. Letter case preference (for ABC content: lowercase, uppercase, both)
4. Number range and counting style (for Numbers content: 1-10, 1-20, simple, skip-counting)
5. Shape complexity and theme (for Shapes content)
6. Animal category and focus (for Animals content)
7. Reading level (for Sight Words content)
8. Character/theme mentions (Paw Patrol, dinosaurs, space, etc.)
9. Target age group (toddler, preschool, early-reader)

Return ONLY a JSON object with this structure (no markdown, no code blocks):
{
  "bookName": "string",
  "category": "string",
  "bookDescription": "string",
  "bookType": "story|alphabet|educational|chapter",
  "letterCase": "lowercase|uppercase|both (only for alphabet content)",
  "metadata": {
    "bookType": "abc|numbers|shapes|colors|animals|sight-words|etc",
    "pageCount": <number or null>,
    "targetAge": "toddler|preschool|early-reader",
    "letterCase": "lowercase|uppercase|both (for ABC content)",
    "numberRange": "1-10|1-20|1-100 (for Numbers content)",
    "countingStyle": "simple|skip-counting|number-families (for Numbers content)",
    "shapeComplexity": "basic|2d-and-3d|advanced (for Shapes content)",
    "shapeTheme": "nature|everyday-objects (for Shapes content)",
    "animalCategory": "farm|zoo|ocean|pets|mixed (for Animals content)",
    "animalFocus": "sounds|habitats|characteristics (for Animals content)",
    "readingLevel": "pre-k|grade-1|grade-2 (for Sight Words content)",
    "characterTheme": "paw-patrol|dinosaurs|space|etc (if mentioned)"
  },
  "pages": [
    {
      "letter": "required for alphabet content - use format matching letterCase",
      "pageNumber": 1,
      "title": "string",
      "description": "string",
      "content": {
        "mainConcept": "string",
        "funFact": "string (optional for non-educational)",
        "activity": "string (optional for non-educational)"${bookType === 'colors' ? ',\n        "color": "string (extracted color name for color content)"' : ''}
      }
    }
  ]
}`;
    }

    // Add color-specific instructions if this is a color book
    if (bookType === 'colors') {
      systemPrompt += `

IMPORTANT - COLOR CONTENT INSTRUCTIONS:
- This is COLOR CONTENT. Each page teaches ONE specific color.
- Extract the color name from each page title and include it in the page metadata.
- Page titles should follow the pattern: "**ColorName:** Description"
  Example: "**Red:** Marshall with a big red fire truck"
- In the JSON response, include the color in each page's content:
  "content": {
    "mainConcept": "...",
    "funFact": "...",
    "activity": "...",
    "color": "red"  // ← Extract this from the title
  }
- Normalize color names to lowercase (Red → red, BLUE → blue)
- Common colors: red, orange, yellow, green, blue, purple, pink, brown, black, white, gray
- Also populate metadata.colorsList (array of unique colors) and metadata.colorsCount at the content level
`;
    }

    const prompt = `Based on this conversation, create a complete children's book:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Return ONLY valid JSON, no other text, no markdown code blocks.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    console.log('Calling Lovable AI to generate book structure');

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 8000, // Allow for full 26-page book
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

    // Determine showTextOverlay flag (default to true for backwards compatibility)
    const showTextOverlay = textOverlayPreference !== 'without-text';

    // Extract and validate metadata
    const metadata = bookData.metadata || {};
    const validatedMetadata = {
      bookType: metadata.bookType || bookData.bookType || bookType || 'custom',
      pageCount: bookData.pages.length,
      targetAge: metadata.targetAge,
      letterCase: metadata.letterCase || bookData.letterCase,
      numberRange: metadata.numberRange,
      countingStyle: metadata.countingStyle,
      shapeComplexity: metadata.shapeComplexity,
      shapeTheme: metadata.shapeTheme,
      animalCategory: metadata.animalCategory,
      animalFocus: metadata.animalFocus,
      readingLevel: metadata.readingLevel,
      characterTheme: metadata.characterTheme,
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
      description: sanitizeText(page.description || '', 500),
      content: {
        mainConcept: sanitizeText(page.content?.mainConcept || '', 500),
        funFact: sanitizeText(page.content?.funFact || '', 500),
        activity: sanitizeText(page.content?.activity || '', 500),
        textOverlay: {
          enabled: false, // Regular pages: NO text overlay by default
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
        metadata: { ...validatedMetadata, hasStyleGuide: !!styleGuide }
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

    // Create cover page as page 1
    // CRITICAL: Cover ALWAYS has text overlay enabled
    const coverPage = {
      book_id: book.id,
      letter: 'COVER',
      page_number: 1,
      title: sanitizeText(bookData.bookName, 100),
      description: sanitizeText(bookData.bookDescription || '', 500),
      content: {
        mainConcept: sanitizeText(bookData.bookName, 500),
        funFact: sanitizeText(bookData.bookDescription || '', 500),
        activity: '',
        textOverlay: {
          enabled: true, // Cover: ALWAYS has text
          text: sanitizeText(bookData.bookName, 100),
          position: 'bottom-center' as const,
          createdAt: new Date().toISOString()
        }
      }
    };

    const pages = [coverPage];

    // Create educational focus page as page 2 if provided
    // CRITICAL: Educational focus page ALWAYS has text overlay enabled
    if (educationalFocus) {
      const eduFocusPage = {
        book_id: book.id,
        letter: 'FOCUS',
        page_number: 2,
        title: 'Educational Focus',
        description: `Age: ${sanitizeText(educationalFocus.targetAge, 50)} | ${sanitizeText(educationalFocus.learningType, 100)}`,
        content: {
          mainConcept: sanitizeText(educationalFocus.targetAge, 200),
          funFact: sanitizeText(educationalFocus.learningType, 200),
          activity: sanitizeText(educationalFocus.specificSkill, 200),
          textOverlay: {
            enabled: true, // Educational focus: ALWAYS has text
            text: 'Educational Focus',
            position: 'bottom-center' as const,
            createdAt: new Date().toISOString()
          }
        }
      };
      pages.push(eduFocusPage);
      console.log('Educational focus page created');
    }

    // Add content pages (starting from page 3 if edu focus exists, else page 2)
    const startingPageNumber = educationalFocus ? 3 : 2;
    pages.push(
      ...sanitizedPages.map((page: any, index: number) => ({
        book_id: book.id,
        letter: page.letter || `Page ${page.pageNumber}`,
        page_number: startingPageNumber + index,
        title: page.title,
        description: page.description || '',
        content: page.content
      }))
    );

    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pages);

    if (pagesError) {
      console.error('Error creating pages:', pagesError);
      // Try to clean up the book
      await supabase.from('books').delete().eq('id', book.id);
      throw new Error('Failed to create pages');
    }

    console.log(`${pages.length} total pages created (cover${educationalFocus ? ' + edu focus' : ''} + ${sanitizedPages.length} content pages)`);

    // Extract AI-generated prompts from conversation history and store them
    console.log('Extracting AI-generated prompts from conversation...');
    
    // Helper function to extract page prompts from conversation
    const extractPagePromptsFromConversation = (messages: any[]): Map<number, string> => {
      const pagePrompts = new Map<number, string>();
      
      // Find the last assistant message with page details
      const lastAssistantMessage = messages
        .filter((m: any) => m.role === 'assistant')
        .reverse()
        .find((m: any) => m.content.includes('**Page'));
      
      if (!lastAssistantMessage) {
        console.log('No AI-generated page prompts found in conversation');
        return pagePrompts;
      }
      
      // Regex to extract page prompts (matches: **Page 1: Title**\nDescription...)
      const pageRegex = /\*\*Page\s+(\d+):\s*["']?([^"'\n*]+)["']?\*+\s*\n([^\n]+(?:\n(?!\*\*Page)[^\n]+)*)/gi;
      let match;
      
      while ((match = pageRegex.exec(lastAssistantMessage.content)) !== null) {
        const [, pageNumStr, title, description] = match;
        const pageNumber = parseInt(pageNumStr, 10);
        
        // Combine title and description as the full prompt
        const fullPrompt = `**Page ${pageNumber}: "${title.trim()}"**\n\n${description.trim()}`;
        pagePrompts.set(pageNumber, fullPrompt);
      }
      
      // Extract cover prompt (NEW FORMAT: **Cover: Title**)
      const coverRegex = /\*\*Cover:\s*([^*\n]+)\*+\s*\n([^\n]+(?:\n(?!\*\*(?:Page|Cover))[^\n]+)*)/gi;
      const coverMatch = coverRegex.exec(lastAssistantMessage.content);
      
      if (coverMatch) {
        const [, coverTitle, coverDescription] = coverMatch;
        const coverPrompt = `**Cover: ${coverTitle.trim()}**\n\n${coverDescription.trim()}`;
        pagePrompts.set(0, coverPrompt); // Cover is page 0
        console.log('Extracted AI-generated cover prompt with theme');
      } else {
        // FALLBACK: Use old format (Book Title + Book Description)
        const bookTitleMatch = lastAssistantMessage.content.match(/\*\*Book Title:\*\*\s*["']?([^"'\n]+)["']?/i);
        const bookDescMatch = lastAssistantMessage.content.match(/\*\*Book Description:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
        
        if (bookTitleMatch && bookDescMatch) {
          const coverPrompt = `${bookDescMatch[1].trim()}\n\nAn educational children's book about ${bookTitleMatch[1].trim()}\n\nCreate a vibrant, engaging cover illustration that captures this theme. The image should:\n- Feature a central focal point\n- Use bright, child-friendly colors\n- Have a clear composition suitable for a book cover\n- Leave space for text overlay in the center`;
          pagePrompts.set(0, coverPrompt);
          console.log('Using fallback cover prompt (old format)');
        }
      }
      
      console.log(`Extracted ${pagePrompts.size} AI-generated prompts from conversation`);
      return pagePrompts;
    };
    
    const aiPrompts = extractPagePromptsFromConversation(conversationHistory);

    // Fetch created pages with IDs
    const { data: createdPagesForPrompts, error: fetchCreatedPagesError } = await supabase
      .from('pages')
      .select('id, page_number, letter, title, description, content')
      .eq('book_id', book.id)
      .order('page_number', { ascending: true });

    if (!fetchCreatedPagesError && createdPagesForPrompts) {
      for (const page of createdPagesForPrompts) {
        const isCover = page.page_number === 1;
        const isFocusPage = page.page_number === 2 && page.letter === 'FOCUS';
        
        // Use AI-generated prompt if available, otherwise create a basic fallback
        let promptContent = aiPrompts.get(page.page_number);
        
        // Check if this is the educational focus page and use its dedicated image prompt
        if (isFocusPage && educationalFocus && educationalFocus.imagePrompt) {
          promptContent = educationalFocus.imagePrompt;
          console.log('Using educational focus image prompt for page 2 (FOCUS page)');
        } else if (!promptContent) {
          // Fallback: Create a simple prompt from page data
          if (isCover) {
            promptContent = `${sanitizeText(bookData.bookDescription || '', 1000)}

An educational children's book about ${sanitizeText(bookData.bookName, 200)}

Create a vibrant, engaging cover illustration that captures this theme. The image should:
- Feature a central focal point
- Use bright, child-friendly colors
- Have a clear composition suitable for a book cover
${showTextOverlay ? '- Leave space for text overlay in the center' : '- No text overlay needed'}`;
          } else {
            promptContent = `**Page ${page.page_number}: "${page.title}"**

${page.description || ''}

${page.content?.mainConcept ? `Main Concept: ${page.content.mainConcept}` : ''}

Create an educational illustration that brings this concept to life with bright, child-friendly visuals.`;
          }
          console.log(`Using fallback prompt for page ${page.page_number}`);
        } else {
          console.log(`Using AI-generated prompt for page ${page.page_number}`);
        }

        // Get version number for this page
        const { data: pageVersionData, error: pageVersionError } = await supabase
          .rpc('get_next_page_prompt_version_number', { p_page_id: page.id });

        if (!pageVersionError) {
          const pageVersionNumber = pageVersionData || 1;

          // Insert page system prompt with AI-generated content
          await supabase
            .from('page_system_prompts')
            .insert({
              page_id: page.id,
              book_id: book.id,
              user_id: userId,
              version_number: pageVersionNumber,
              content: promptContent,
              is_latest: true,
              is_deployed: true,
              deployed_at: new Date().toISOString(),
              source_type: 'ai_generated',
              generation_metadata: {
                generator: 'google-chat-ai',
                bookType: validatedMetadata.bookType,
                pageType: isCover ? 'cover' : isFocusPage ? 'educational-focus' : 'content',
                generatedAt: new Date().toISOString(),
                extractedFromConversation: aiPrompts.has(page.page_number),
                usedEducationalFocusPrompt: isFocusPage && educationalFocus && !!educationalFocus.imagePrompt
              }
            });
          
          console.log(`Stored AI prompt for page ${page.page_number} (${isCover ? 'cover' : page.letter})`);
        }
      }
      
      console.log(`Stored AI-generated prompts for ${createdPagesForPrompts.length} pages`);
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
                prompt_used: `User uploaded from QA checkpoint for page ${pageNumber}`,
                is_latest: true,
                source_type: 'user_uploaded'
              });
            
            if (imageUrlError) {
              console.error(`Failed to create image URL record for page ${pageNumber}:`, imageUrlError);
            } else {
              console.log(`QA image uploaded for page ${pageNumber}`);
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
