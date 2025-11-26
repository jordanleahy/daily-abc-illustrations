import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';
import { BOOK_TYPE_TO_AGENT_TYPE } from '../_shared/types.ts';
import { DISCOVERY_PROMPT } from './specialized-chat-prompts.ts';
import { UNIVERSAL_INTAKE_PROMPT } from './universal-intake-prompt.ts';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface SuggestedAction {
  id: string;
  label: string;
  value: string;
  themeId?: string;
  ageRangeId?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

// Optional parser for AI suggestions
function parseSuggestions(aiResponse: string): { 
  cleanContent: string; 
  suggestedActions?: SuggestedAction[] 
} {
  const suggestRegex = /\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/;
  const match = aiResponse.match(suggestRegex);
  
  if (!match) {
    return { cleanContent: aiResponse };
  }
  
  const suggestionsText = match[1].trim();
  const cleanContent = aiResponse.replace(suggestRegex, '').trim();
  
  // Known character themes - synced with universal-intake-prompt.ts
  const CHARACTER_THEMES = new Set([
    'paw-patrol', 'frozen', 'peppa-pig', 'bluey', 'cocomelon', 
    'moana', 'mickey-mouse', 'mario', 'sesame-street', 
    'benji-davies', 'black-and-white', 'bear-stories',
    'custom', 'no-theme'
  ]);

  // Known age ranges - synced with AgeRangeId enum
  const AGE_RANGES = new Set([
    '0-2', '2-4', '4-6', '6-8', '8-10', '10-12', 'other'
  ]);

  const suggestedActions = suggestionsText
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return null;
      
      const id = line.substring(0, colonIndex).trim();
      const label = line.substring(colonIndex + 1).trim();
      
      return {
        id,
        label,
        value: id === 'custom' ? '' : `${label}`,
        themeId: CHARACTER_THEMES.has(id) ? id : undefined,
        ageRangeId: AGE_RANGES.has(id) ? id : undefined
      };
    })
    .filter((action): action is SuggestedAction => action !== null);
  
  return { cleanContent, suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, outlineReady, bookCreated, kidAge, bookType, characterTheme } = await req.json() as { 
      messages: Message[];
      outlineReady?: boolean;
      bookCreated?: boolean;
      kidAge?: { years: number; months: number };
      bookType?: string;
      characterTheme?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which agent and system prompt to use
    let systemPromptContent: string;
    let agentSource: string;

    if (bookType) {
      // Book type selected - route directly to specialized agent
      console.log(`📚 Book type selected: ${bookType}, routing to specialized agent`);
      
      // Map book type to agent type
      const agentType = BOOK_TYPE_TO_AGENT_TYPE[bookType] || 'book-creation';
      console.log(`🎯 Mapped to agent type: ${agentType}`);
      
      // Query for specialized agent from database
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('instructions, name')
        .eq('type', agentType)
        .eq('is_latest', true)
        .single();
      
      if (agentError) {
        console.log(`⚠️ No database agent found for ${agentType}: ${agentError.message}`);
      }
      
      // Use database agent (single source of truth)
      if (agent?.instructions) {
        systemPromptContent = agent.instructions;
        agentSource = `Database: ${agent.name} (Specialized)`;
        console.log(`✅ Using database specialized agent: ${agent.name} (${agent.instructions.length} chars)`);
        
        // Warn if prompt seems suspiciously short
        if (agent.instructions.length < 500) {
          console.warn(`⚠️ Agent prompt is suspiciously short (${agent.instructions.length} chars). This may indicate incomplete configuration.`);
        }
      } else {
        // No database agent found - use discovery prompt
        console.log(`⚠️ No database agent found for ${agentType}, using discovery prompt`);
        systemPromptContent = DISCOVERY_PROMPT;
        agentSource = 'File: Discovery prompt (fallback)';
      }
    } else {
      // No book type selected - use discovery prompt
      systemPromptContent = DISCOVERY_PROMPT;
      agentSource = 'File: Discovery prompt';
      console.log('🔍 No book type selected, using discovery prompt');
    }

    // Add context about kid age and theme if already provided
    const ageContext = kidAge 
      ? `\n\n👶 CHILD AGE CONTEXT:\nThe selected child is ${kidAge.years} years and ${kidAge.months} months old. Skip the age discovery question and use this age to tailor all educational content, vocabulary, and complexity to this specific developmental stage.`
      : '';

    // Handle theme context if already provided
    const themeContext = characterTheme
      ? characterTheme === 'custom'
        ? `\n\n🎨 CUSTOM THEME REQUESTED:\nThe user wants a custom character theme but hasn't specified it yet. Ask them: "What character, style, or theme would you like? (e.g., dinosaurs, unicorns, superheroes, ocean animals)" Once they provide their custom theme, integrate it throughout the book outline.`
        : characterTheme === 'no-theme'
        ? `\n\n📚 NO THEME SELECTED:\nThe user prefers an educational-only book without character themes. Skip the theme discovery question. Focus purely on educational content with classic, simple illustrations. Do NOT integrate any character themes.`
        : `\n\n🎨 CHARACTER THEME SELECTED:\nThe user has selected "${characterTheme}" as the character theme. Skip the theme discovery question and integrate this character throughout the book outline including cover page, educational focus page, and all content pages. Make specific references to the character in image descriptions.`
      : '';

    const conversationStageContext = outlineReady
      ? '\n\n✅ OUTLINE COMPLETE: The book outline has been created and approved. Focus conversation on next steps: reviewing pages, creating the book, or making adjustments.'
      : bookCreated
      ? '\n\n📖 BOOK CREATED: The book has been successfully created in the database. User can now review pages, generate images, or make edits.'
      : '\n\n🎯 DISCOVERY PHASE: Guide the user through the book creation conversation to gather all requirements for generating a complete outline.';

    // Fetch user's custom style templates for context
    const { data: styleTemplates } = await supabase
      .from('books')
      .select('id, book_name, style_name')
      .eq('user_id', user.id)
      .eq('is_style_template', true)
      .order('created_at', { ascending: false })
      .limit(5);

    const styleContext = styleTemplates && styleTemplates.length > 0
      ? `\n\n📚 AVAILABLE STYLE TEMPLATES:\n${styleTemplates.map((t: any) => `- "${t.style_name || t.book_name}" (ID: ${t.id})`).join('\n')}\nYou can reference these when suggesting illustration styles.`
      : '';

    // Combine base prompt with contextual additions
    const systemMessage: Message = {
      role: 'system',
      content: systemPromptContent + ageContext + themeContext + conversationStageContext + styleContext,
    };

    console.log(`🤖 Agent source: ${agentSource}`);
    console.log(`📊 System prompt length: ${systemMessage.content.length} characters`);
    console.log(`📊 Conversation stage: ${outlineReady ? 'Outline Ready' : bookCreated ? 'Book Created' : 'Discovery'}`);
    console.log(`👶 Kid age provided: ${kidAge ? `${kidAge.years}y ${kidAge.months}m` : 'No'}`);
    console.log(`🎨 Character theme: ${characterTheme || 'None'}`);
    console.log(`🎨 Style templates available: ${styleTemplates?.length || 0}`);

    // Format messages for Gemini (handles both text and multimodal content)
    const formattedMessages = messages.map(msg => {
      // If content is already an array (multimodal), return as-is
      if (Array.isArray(msg.content)) {
        return msg;
      }
      return msg;
    });

    const allMessages = [systemMessage, ...formattedMessages];

    console.log('Calling Lovable AI with', allMessages.length, 'messages');

    // Call Lovable AI Gateway with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lovable AI streaming response started');

    // Return the stream directly with proper headers
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in google-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
