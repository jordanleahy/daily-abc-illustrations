/**
 * Chat Edge Function for ABC Cards Agent
 * 
 * This function provides an API endpoint for chat interactions using the user's configured ABC Cards agent.
 * It retrieves agent configuration from the database and uses those settings for OpenAI API calls.
 * 
 * Features:
 * - Uses agent configuration from database (instructions, model, settings)
 * - Handles CORS for web application access
 * - Includes proper error handling and logging
 * - Supports conversation history through message arrays
 * - Requires user authentication to access agent config
 * 
 * Usage:
 * POST request with body: { "messages": [{ "role": "user", "content": "Hello" }] }
 * Requires Authorization header with valid Supabase JWT token
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key for authentication
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // Environment variables
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

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

    // Fetch the agent configuration from database (using service role, so we filter manually)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
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
      max_completion_tokens: agent.max_completion_tokens
    });

    // Prepare messages with system instructions
    const systemMessage = {
      role: 'system',
      content: agent.instructions
    };

    // Combine system message with user messages
    const allMessages = [systemMessage, ...messages];

    // Prepare OpenAI API parameters based on model
    const isLegacyModel = agent.model === 'gpt-4o' || agent.model === 'gpt-4o-mini';
    const apiParams: any = {
      model: agent.model,
      messages: allMessages,
    };

    // Use correct token parameter based on model
    if (isLegacyModel) {
      apiParams.max_tokens = agent.max_completion_tokens;
    } else {
      apiParams.max_completion_tokens = agent.max_completion_tokens;
    }

    // Add top_p if it's not the default
    if (agent.top_p && agent.top_p !== 1.0) {
      apiParams.top_p = agent.top_p;
    }

    console.log('OpenAI API parameters:', apiParams);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(JSON.stringify({ content: assistantMessage }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});