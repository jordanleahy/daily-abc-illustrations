/**
 * Chat Edge Function for ABC Cards Agent
 * 
 * This function provides an API endpoint for chat interactions using the user's configured ABC Cards agent.
 * It retrieves agent configuration from the database and uses those settings for AI API calls via Lovable AI Gateway.
 * 
 * Features:
 * - Multi-provider support: OpenAI (GPT-5), Google (Gemini), DeepSeek
 * - Uses agent configuration from database (instructions, model, settings)
 * - Handles CORS for web application access
 * - Includes proper error handling and logging
 * - Supports conversation history through message arrays
 * - Requires user authentication to access agent config
 * - Vision support for image-based interactions
 * 
 * Usage:
 * POST request with body: { "messages": [{ "role": "user", "content": "Hello" }] }
 * Requires Authorization header with valid Supabase JWT token
 * 
 * Environment Variables Required:
 * - LOVABLE_API_KEY: API key for Lovable AI Gateway (auto-configured)
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (bypasses RLS)
 * 
 * Returns:
 * - Success: { "content": "AI response text" }
 * - Error: { "error": "Error message" }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/types.ts';
import type { AgentConfig } from '../_shared/types.ts';
import { callAIProvider } from '../_shared/aiProviders.ts';
import { z } from 'https://esm.sh/zod@3.22.4';

// Input validation schema
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000),
  images: z.array(z.string().url()).max(10).optional(),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  outlineReady: z.boolean().optional(),
  bookCreated: z.boolean().optional(),
});


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input parameters',
          details: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = validationResult.data;
    
    // Environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration not found');
    }

    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    console.log('Authenticated user:', user.id);

    // Fetch the latest chat agent configuration from database (using service role, so we filter manually)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'chat')
      .eq('is_latest', true)
      .maybeSingle();

    if (agentError) {
      console.error('Error fetching agent:', agentError);
      throw new Error('Failed to fetch agent configuration');
    }

    if (!agent) {
      throw new Error('No agent configuration found. Please configure your ABC Cards agent first.');
    }

    console.log('Using agent configuration:', {
      name: agent.name,
      model: agent.model,
      provider: agent.provider || 'openai',
      max_completion_tokens: agent.max_completion_tokens
    });

    // Prepare the agent config object for the AI provider
    const agentConfig: AgentConfig = {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      intent: agent.intent,
      status: agent.operational_status,
      instructions: agent.instructions,
      provider: agent.provider || 'openai', // Default to openai for backwards compatibility
      model: agent.model,
      max_completion_tokens: agent.max_completion_tokens,
      top_p: agent.top_p,
    };

    // Check if any message contains images
    const hasImages = messages.some((msg: any) => msg.images && msg.images.length > 0);
    
    // Convert messages to OpenAI format, handling images if present
    const formattedMessages = messages.map((msg: any) => {
      if (msg.images && msg.images.length > 0) {
        // Format message with images for vision API
        const content = [
          {
            type: "text",
            text: msg.content
          },
          ...msg.images.map((image: string) => ({
            type: "image_url",
            image_url: {
              url: image
            }
          }))
        ];
        
        return {
          role: msg.role,
          content: content
        };
      } else {
        // Regular text message
        return {
          role: msg.role,
          content: msg.content
        };
      }
    });

    // Prepare system message with context-aware instructions
    const systemMessage = {
      role: 'system',
      content: agentConfig.instructions + 
        (validationResult.data.bookCreated 
          ? '\n\nIMPORTANT: A book has already been created in this session. You should:\n- Continue general conversation and answer questions\n- Provide help and guidance about their created book\n- NOT suggest creating new books\n- NOT provide [SUGGEST] action buttons for new books\n- NOT include book recommendations\n- Inform user they need to start a new chat session to create another book'
          : '') +
        (validationResult.data.outlineReady && !validationResult.data.bookCreated
          ? '\n\nUI Button Instructions: When telling users to open the QA panel to review pages and add photos, instruct them to click the "📖 View Pages & Add Photos" button that appears in your response messages, or the "Review Outline" floating button at the bottom-right of the screen.'
          : '')
    };

    // Combine system message with formatted user messages
    const allMessages = [systemMessage, ...formattedMessages];

    // Note: Modern models (GPT-5, Gemini 2.5, etc.) support vision natively when images are included
    console.log(`Making ${agentConfig.provider} API call with model:`, agentConfig.model);

    // Call AI provider using the shared utility
    const response = await callAIProvider(agentConfig, allMessages);

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log(`${agentConfig.provider} response received`);

    return new Response(JSON.stringify({ 
      response: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});