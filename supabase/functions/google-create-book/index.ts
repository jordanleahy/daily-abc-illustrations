import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateSpecializedPrompt } from '../_shared/promptTemplates.ts';

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
  bookType: z.string().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    const { conversationHistory, userId, pageDetails, qaImages, bookType } = validatedData;
    
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
      
      systemPrompt = `You are creating a children's book. The user has already designed specific pages in our conversation.

CRITICAL INSTRUCTIONS: 
- You MUST use the exact page titles and descriptions provided below. Do NOT change them.
- Do NOT include aspect ratio specifications (like "1:1", "16:9", etc.) in any titles or descriptions
- Aspect ratios are handled separately by the image generation tool
- EXTRACT metadata from the conversation (book type, page count, character theme, etc.)

PROVIDED PAGE STRUCTURE:
${pageDetails.map(p => `Page ${p.pageNumber}: "${p.title}"\n${p.description}`).join('\n\n')}

Your task:
1. Create a bookName (creative title that encompasses all pages)
2. Choose a category (alphabet, numbers, emotions, animals, etc.)
3. Write a bookDescription (2-3 sentences about the whole book)
4. For each page, maintain the exact title and description provided
5. Add content fields (mainConcept, funFact, activity) for each page
6. Assign appropriate letters for alphabet books (A-Z pattern)
7. Extract and return metadata from conversation

Return ONLY valid JSON with this structure:
{
  "bookName": "string",
  "category": "string", 
  "bookDescription": "string",
  "metadata": {
    "bookType": "abc|numbers|shapes|colors|animals|etc",
    "pageCount": ${pageDetails.length},
    "letterCase": "lowercase|uppercase|both (for ABC books)",
    "numberRange": "1-10 (for Numbers books)",
    "countingStyle": "simple|skip-counting (for Numbers books)",
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
        "activity": "string"${bookType === 'colors' ? ',\n        "color": "string (extracted color name for color books)"' : ''}
      }
    }
  ]
}`;
    } else {
      // No structured details - use original full AI generation prompt
      systemPrompt = `You are an expert at creating children's books of all types.
Based on the conversation, determine the most appropriate book format and create a complete book structure.

Book Types:
- "alphabet": ABC learning books with 26 pages (A-Z), each page teaching a letter
  * For alphabet books, check if user specified letter case:
    - "lowercase" or "lowercase letters": use a, b, c... format
    - "uppercase" or "uppercase letters": use A, B, C... format
    - "both" or "both cases": use Aa, Bb, Cc... format
    - Default to uppercase (A, B, C...) if not specified
- "story": Narrative story books with 8-16 pages telling a cohesive story
- "educational": Topic-based learning books with 10-20 pages covering different aspects
- "chapter": Longer books with 15-26 pages divided into chapters

IMPORTANT: 
- Do NOT include aspect ratio specifications (like "1:1", "16:9", etc.) in page titles or descriptions
- Aspect ratios are handled separately by the image generation tool
- For NON-alphabet books, do NOT include "letter" fields
- For alphabet books, include "letter" field with values matching the specified case format
- Adjust page count based on book type and complexity
- Make content age-appropriate and engaging
- EXTRACT and RETURN metadata from the conversation (book type, page count preferences, themes, etc.)

METADATA EXTRACTION:
Analyze the conversation for:
1. Book type selected (ABC, Numbers, Shapes, Animals, Sight Words, etc.)
2. Number of pages requested (5, 10, 15, 20, custom, or "let agent decide")
3. Letter case preference (for ABC books: lowercase, uppercase, both)
4. Number range and counting style (for Numbers books: 1-10, 1-20, simple, skip-counting)
5. Shape complexity and theme (for Shapes books)
6. Animal category and focus (for Animals books)
7. Reading level (for Sight Words books)
8. Character/theme mentions (Paw Patrol, dinosaurs, space, etc.)
9. Target age group (toddler, preschool, early-reader)

Return ONLY a JSON object with this structure (no markdown, no code blocks):
{
  "bookName": "string",
  "category": "string",
  "bookDescription": "string",
  "bookType": "story|alphabet|educational|chapter",
  "letterCase": "lowercase|uppercase|both (only for alphabet books)",
  "metadata": {
    "bookType": "abc|numbers|shapes|colors|animals|sight-words|etc",
    "pageCount": <number or null>,
    "targetAge": "toddler|preschool|early-reader",
    "letterCase": "lowercase|uppercase|both (for ABC books)",
    "numberRange": "1-10|1-20|1-100 (for Numbers books)",
    "countingStyle": "simple|skip-counting|number-families (for Numbers books)",
    "shapeComplexity": "basic|2d-and-3d|advanced (for Shapes books)",
    "shapeTheme": "nature|everyday-objects (for Shapes books)",
    "animalCategory": "farm|zoo|ocean|pets|mixed (for Animals books)",
    "animalFocus": "sounds|habitats|characteristics (for Animals books)",
    "readingLevel": "pre-k|grade-1|grade-2 (for Sight Words books)",
    "characterTheme": "paw-patrol|dinosaurs|space|etc (if mentioned)"
  },
  "pages": [
    {
      "letter": "required for alphabet books - use format matching letterCase",
      "pageNumber": 1,
      "title": "string",
      "description": "string",
      "content": {
        "mainConcept": "string",
        "funFact": "string (optional for non-educational)",
        "activity": "string (optional for non-educational)"${bookType === 'colors' ? ',\n        "color": "string (extracted color name for color books)"' : ''}
      }
    }
  ]
}`;
    }

    // Add color-specific instructions if this is a color book
    if (bookType === 'colors') {
      systemPrompt += `

IMPORTANT - COLOR BOOK INSTRUCTIONS:
- This is a COLOR BOOK. Each page teaches ONE specific color.
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
- Also populate metadata.colorsList (array of unique colors) and metadata.colorsCount at the book level
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
    const sanitizedPages = bookData.pages.map((page: any) => ({
      ...page,
      letter: sanitizeText(page.letter || '', 10),
      title: sanitizeText(page.title, 100),
      description: sanitizeText(page.description || '', 500),
      content: {
        mainConcept: sanitizeText(page.content?.mainConcept || '', 500),
        funFact: sanitizeText(page.content?.funFact || '', 500),
        activity: sanitizeText(page.content?.activity || '', 500)
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
        total_pages: sanitizedPages.length + 1, // Add 1 for cover page
        status: 'draft',
        metadata: validatedMetadata
      })
      .select()
      .single();

    if (bookError || !book) {
      console.error('Error creating book:', bookError);
      throw new Error('Failed to create book');
    }

    console.log('Book created with ID:', book.id);

    // Create cover page first (page_number 0)
    const coverPage = {
      book_id: book.id,
      letter: 'Cover',
      page_number: 0,
      title: sanitizeText(bookData.bookName, 100),
      description: sanitizeText(bookData.bookDescription || '', 500),
      content: {
        mainConcept: sanitizeText(bookData.bookName, 500),
        funFact: sanitizeText(bookData.bookDescription || '', 500),
        activity: ''
      }
    };

    // Insert sanitized pages (starting from page 1)
    const pages = [
      coverPage,
      ...sanitizedPages.map((page: any) => ({
        book_id: book.id,
        letter: page.letter || `Page ${page.pageNumber}`,
        page_number: page.pageNumber,
        title: page.title,
        description: page.description || '',
        content: page.content
      }))
    ];

    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pages);

    if (pagesError) {
      console.error('Error creating pages:', pagesError);
      // Try to clean up the book
      await supabase.from('books').delete().eq('id', book.id);
      throw new Error('Failed to create pages');
    }

    console.log(`Cover page + ${pages.length - 1} content pages created`);

    // Generate page system prompts for all pages
    console.log('Generating page system prompts...');
    
    const bookContext = {
      bookName: sanitizeText(bookData.bookName, 200),
      category: sanitizeText(bookData.category || 'General', 100),
      bookDescription: sanitizeText(bookData.bookDescription || '', 1000),
      theme: validatedMetadata.characterTheme,
      characterTheme: validatedMetadata.characterTheme,
      targetAge: validatedMetadata.targetAge,
      bookType: validatedMetadata.bookType
    };

    // Fetch created pages with IDs
    const { data: createdPagesForPrompts, error: fetchCreatedPagesError } = await supabase
      .from('pages')
      .select('id, page_number, letter, title, description, content')
      .eq('book_id', book.id)
      .order('page_number', { ascending: true });

    if (!fetchCreatedPagesError && createdPagesForPrompts) {
      for (const page of createdPagesForPrompts) {
        const isCover = page.page_number === 0;
        
        const pageContext = {
          pageNumber: page.page_number,
          letter: page.letter,
          title: page.title,
          description: page.description || '',
          mainConcept: page.content?.mainConcept
        };

        // Generate specialized prompt using templates
        const promptContent = generateSpecializedPrompt(bookContext, pageContext, isCover);

        // Get version number for this page
        const { data: pageVersionData, error: pageVersionError } = await supabase
          .rpc('get_next_page_prompt_version_number', { p_page_id: page.id });

        if (!pageVersionError) {
          const pageVersionNumber = pageVersionData || 1;

          // Insert page system prompt
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
              source_type: 'book_creation',
              generation_metadata: {
                generator: 'google-create-book',
                bookType: validatedMetadata.bookType,
                pageType: isCover ? 'cover' : 'content',
                generatedAt: new Date().toISOString()
              }
            });
          
          console.log(`Created prompt for page ${page.page_number} (${isCover ? 'cover' : page.letter})`);
        }
      }
      
      console.log(`Generated page system prompts for ${createdPagesForPrompts.length} pages`);
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
- No text in the image (text will be overlaid separately)
- Child-friendly, positive imagery only

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

    // Create draft daily_published entry
    await supabase
      .from('daily_published')
      .insert({
        book_id: book.id,
        status: 'draft',
        is_active: false
      });


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
