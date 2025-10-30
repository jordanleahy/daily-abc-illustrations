import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

const requestSchema = z.object({
  conversationHistory: z.array(conversationMessageSchema),
  userId: z.string().uuid()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { conversationHistory, userId } = requestSchema.parse(body);

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

    // Prepare prompt for book creation
    const systemPrompt = `You are an expert at creating children's books of all types.
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
- For NON-alphabet books, do NOT include "letter" fields
- For alphabet books, include "letter" field with values matching the specified case format
- Adjust page count based on book type and complexity
- Make content age-appropriate and engaging

Return ONLY a JSON object with this structure (no markdown, no code blocks):
{
  "bookName": "string",
  "category": "string",
  "bookDescription": "string",
  "bookType": "story|alphabet|educational|chapter",
  "letterCase": "lowercase|uppercase|both (only for alphabet books)",
  "pages": [
    {
      "letter": "required for alphabet books - use format matching letterCase",
      "pageNumber": 1,
      "title": "string",
      "description": "string",
      "content": {
        "mainConcept": "string",
        "funFact": "string (optional for non-educational)",
        "activity": "string (optional for non-educational)"
      }
    }
  ]
}`;

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

    console.log(`Creating book: ${bookData.bookName} with ${bookData.pages.length} pages`);

    // Insert book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: bookData.bookName,
        category: bookData.category || 'General',
        book_description: bookData.bookDescription || '',
        total_pages: bookData.pages.length,
        status: 'draft'
      })
      .select()
      .single();

    if (bookError || !book) {
      console.error('Error creating book:', bookError);
      throw new Error('Failed to create book');
    }

    console.log('Book created with ID:', book.id);

    // Insert pages
    const pages = bookData.pages.map((page: any) => ({
      book_id: book.id,
      letter: page.letter || `Page ${page.pageNumber}`, // Fallback for non-ABC books
      page_number: page.pageNumber,
      title: page.title,
      description: page.description || '',
      content: page.content
    }));

    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pages);

    if (pagesError) {
      console.error('Error creating pages:', pagesError);
      // Try to clean up the book
      await supabase.from('books').delete().eq('id', book.id);
      throw new Error('Failed to create pages');
    }

    console.log(`Created ${pages.length} pages`);

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
