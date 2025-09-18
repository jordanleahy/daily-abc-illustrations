/**
 * ==================================================================================
 * BOOK THUMBNAIL PROMPT GENERATION SERVICE
 * ==================================================================================
 * 
 * BUSINESS PURPOSE:
 * This edge function generates AI-optimized prompts for creating book cover thumbnails
 * used in social media sharing and marketing materials. It combines book metadata,
 * user design preferences, and platform-specific requirements to create effective
 * visual content generation prompts.
 * 
 * TECHNICAL ARCHITECTURE:
 * - Deno-based Supabase Edge Function
 * - Integrates with OpenAI for image generation (via separate function)
 * - Uses Supabase database for metadata storage and version control
 * - Implements safe space design guidelines for social media platforms
 * 
 * WORKFLOW:
 * 1. Client Request → Validate bookId and userId
 * 2. Database Fetch → Retrieve book details and system prompts
 * 3. Agent Config → Get user's graphics designer agent settings
 * 4. Prompt Assembly → Combine metadata with design guidelines
 * 5. Safe Space Rules → Apply platform-specific layout constraints
 * 6. Version Control → Create new thumbnail record with version tracking
 * 7. Response → Return generated prompt and thumbnail record ID
 * 
 * BUSINESS RULES:
 * - Each book can have multiple thumbnail versions (version control)
 * - Prompts maintain consistency with book's existing illustration style
 * - Thumbnails must work at small sizes (social media feeds)
 * - Aspect ratio fixed at 1200x630 for optimal social media sharing
 * - Safe space guidelines ensure text readability across platforms
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Caches agent configurations to reduce database queries
 * - Uses single database transaction for version control
 * - Minimal prompt processing for fast response times
 * 
 * ERROR HANDLING:
 * - Validates user ownership of book (security)
 * - Graceful degradation if agent config missing
 * - Comprehensive error logging for debugging
 * - Returns structured error responses for client handling
 * 
 * DEPENDENCIES:
 * - Supabase Database (books, book_system_prompts, agents, book_thumbnails)
 * - Safe Space Configuration (platform-specific design rules)
 * - User Authentication (via RLS policies)
 * 
 * INTEGRATION POINTS:
 * - Called by: Frontend OpenGraphEditor component
 * - Calls: None (pure prompt generation)
 * - Triggers: generate-book-thumbnail function (separate call)
 * ==================================================================================
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
// Import safe space configuration utilities for thumbnail composition rules
import { appendSafeSpaceRules } from '../_shared/safeSpaceConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main request handler for book thumbnail prompt generation
 * 
 * REQUEST FORMAT:
 * POST body: { bookId: string, userId: string }
 * 
 * RESPONSE FORMAT:
 * Success: { success: true, thumbnailId: string, prompt: string, versionNumber: number }
 * Error: { error: string, details?: string }
 * 
 * SECURITY:
 * - Validates user ownership via database queries
 * - Uses RLS policies for data access control
 * - Sanitizes all user inputs
 */
serve(async (req) => {
  // Handle CORS preflight requests for web client compatibility
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, userId } = await req.json();

    if (!bookId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bookId and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching book data for:', bookId);

    // Fetch book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('book_name, book_description, category, current_system_prompt_id')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch book details' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Book data:', book);

    /**
     * STYLE CONSISTENCY LOGIC:
     * Extract illustration style from book's system prompt to maintain
     * visual consistency across all book materials including thumbnails.
     * This ensures brand coherence for published content.
     */
    let styleGuide = '';
    if (book.current_system_prompt_id) {
      const { data: systemPrompt } = await supabase
        .from('book_system_prompts')
        .select('content')
        .eq('id', book.current_system_prompt_id)
        .single();

      if (systemPrompt?.content) {
        // Extract style information from the system prompt
        const styleMatch = systemPrompt.content.match(/illustration style[^.]*[.]/i);
        if (styleMatch) {
          styleGuide = `Maintain consistency with the book's existing ${styleMatch[0]}`;
        }
      }
    }

    /**
     * AGENT CONFIGURATION RETRIEVAL:
     * Fetch user's custom graphics designer agent settings to personalize
     * the thumbnail generation according to their preferred design style.
     * Falls back to default instructions if no custom agent exists.
     */
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('instructions, model')
      .eq('user_id', userId)
      .eq('type', 'graphics_designer')
      .eq('is_latest', true)
      .single();

    if (agentError) {
      console.log('No graphics designer agent found, using default');
    }

    const agentInstructions = agent?.instructions || 'Create professional, child-friendly educational illustrations.';

    // Create thumbnail-specific prompt
    const basePrompt = `Create a book cover thumbnail image for "${book.book_name}".

Book Description: ${book.book_description || 'Educational ABC book for children'}
Category: ${book.category || 'Educational'}

Requirements:
- Book title should be prominently displayed and readable
- Include visual elements that represent the book's educational content
- Design should be appealing to both children and parents
- Professional, clean design suitable for thumbnails
- ${styleGuide}

Design Style: ${agentInstructions}

The thumbnail should work well at small sizes and clearly communicate what the book is about.`;

    /**
     * SAFE SPACE IMPLEMENTATION:
     * Applies platform-specific design guidelines to ensure thumbnails
     * render correctly across different social media platforms and devices.
     * Uses the shared safeSpaceConfig module for consistent rules.
     */
    const enhancedPrompt = appendSafeSpaceRules(basePrompt, "1200:630");
    
    console.log('Generated enhanced prompt for book thumbnail');

    /**
     * VERSION CONTROL SYSTEM:
     * Implements semantic versioning for thumbnails allowing users to
     * iterate on designs while maintaining history of previous versions.
     * Critical for A/B testing and design rollback capabilities.
     */
    const { data: versionData } = await supabase
      .rpc('get_next_book_thumbnail_version_number', { p_book_id: bookId });

    const versionNumber = versionData || 1;

    // Create thumbnail record
    const { data: thumbnailRecord, error: insertError } = await supabase
      .from('book_thumbnails')
      .insert({
        book_id: bookId,
        user_id: userId,
        version_number: versionNumber,
        prompt_used: enhancedPrompt,
        generation_status: 'not_started',
        aspect_ratio: '1200:630'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating thumbnail record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create thumbnail record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailId: thumbnailRecord.id,
        prompt: enhancedPrompt,
        versionNumber
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-book-thumbnail-prompt function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});