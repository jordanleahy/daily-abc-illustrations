/**
 * What Changed in Agent Edge Function
 * 
 * This function analyzes the differences between two agent configurations and provides
 * a user-friendly description of what changed using AI via Lovable AI Gateway.
 * 
 * Purpose:
 * - Compares original and new agent configurations (using database field structure)
 * - Uses AI to generate human-readable summaries of changes
 * - Provides fallback logic if AI analysis fails
 * - Helps users understand what modifications were made to their agents
 * - Supports multi-provider agents (OpenAI, Google, DeepSeek)
 * 
 * Features:
 * - AI-powered change analysis using Google Gemini 2.5 Flash via Lovable AI Gateway
 * - Comprehensive fallback system for reliability
 * - CORS support for web application access
 * - Detailed logging for debugging
 * - Always returns success (200) to not interrupt save workflows
 * - Rate limit and payment error handling
 * 
 * Usage:
 * POST request with body: {
 *   "originalConfig": DatabaseAgentRecord,
 *   "newConfig": DatabaseAgentRecord
 * }
 * 
 * DatabaseAgentRecord Structure (matches database schema):
 * {
 *   name: string,
 *   type: 'chat' | 'book-creation' | 'illustration-director' | 'graphic-designer',
 *   intent: string,
 *   operational_status: 'online' | 'offline' | 'processing',
 *   instructions: string,
 *   provider: 'openai' | 'google' | 'deepseek',
 *   model: string,
 *   max_completion_tokens: number,
 *   top_p: number
 * }
 * 
 * Environment Variables Required:
 * - LOVABLE_API_KEY: API key for Lovable AI Gateway (auto-configured)
 * - SUPABASE_URL: Supabase project URL (for future database integration)
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (for future use)
 * 
 * Returns:
 * - Success: { "whatChanged": "User-friendly description of changes" }
 * - With Error: { "whatChanged": "Fallback description", "error": "Error details" }
 * 
 * Examples of Generated Descriptions:
 * - "Instructions expanded and model changed to google/gemini-2.5-pro."
 * - "Name updated to 'ABC Cards Helper' and status changed to online."
 * - "Minor configuration updates made."
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders, AgentConfig, CompareRequest } from '../_shared/types.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!


// Simple, safe fallback diff in case the OpenAI response is empty or fails
function computeFallbackChanges(orig: any, next: any): string {
  const changes: string[] = [];
  if (orig.name !== next.name) changes.push(`Name updated to "${next.name}"`);
  if (orig.type !== next.type) changes.push(`Type changed to ${next.type}`);
  if (orig.intent !== next.intent) changes.push('Intent updated');
  if (orig.operational_status !== next.operational_status) changes.push(`Status changed to ${next.operational_status}`);
  if (orig.model !== next.model) changes.push(`Model changed to ${next.model}`);
  if (orig.max_completion_tokens !== next.max_completion_tokens) changes.push(`Max tokens set to ${next.max_completion_tokens}`);
  if (orig.top_p !== next.top_p) changes.push(`Top P set to ${next.top_p}`);
  if (orig.instructions !== next.instructions) {
    const delta = (next.instructions?.length || 0) - (orig.instructions?.length || 0);
    const direction = delta > 0 ? 'expanded' : 'refined';
    changes.push(`Instructions ${direction}`);
  }
  if (changes.length === 0) return 'Minor configuration updates made.';
  if (changes.length === 1) return changes[0] + '.';
  const last = changes.pop();
  return `${changes.join(', ')} and ${last}.`;
}
serve(async (req) => {
  console.log('Edge function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Keep parsed configs available for fallback handling
  let originalConfig: any | null = null;
  let newConfig: any | null = null;

  try {
    console.log('Parsing request body...');
    const body = await req.text();
    console.log('Raw request body:', body);
    
    const parsed: CompareRequest = JSON.parse(body);
    originalConfig = parsed.originalConfig;
    newConfig = parsed.newConfig;
    console.log('Parsed originalConfig:', JSON.stringify(originalConfig, null, 2));
    console.log('Parsed newConfig:', JSON.stringify(newConfig, null, 2));
    
    console.log('Comparing agent configurations...');

    // Validate Lovable API key
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create detailed comparison prompt using database field names
    const prompt = `Compare these two AI agent configurations and describe what changed in a concise, user-friendly way. Focus on meaningful changes that could impact the agent's behavior or performance.

ORIGINAL CONFIG:
- Name: "${originalConfig.name}"
- Type: ${originalConfig.type}
- Intent: "${originalConfig.intent}"
- Status: ${originalConfig.operational_status}
- Model: ${originalConfig.model}
- Max Tokens: ${originalConfig.max_completion_tokens}
- Top P: ${originalConfig.top_p}
- Instructions: "${originalConfig.instructions}"

NEW CONFIG:
- Name: "${newConfig.name}"
- Type: ${newConfig.type}
- Intent: "${newConfig.intent}"
- Status: ${newConfig.operational_status}
- Model: ${newConfig.model}
- Max Tokens: ${newConfig.max_completion_tokens}
- Top P: ${newConfig.top_p}
- Instructions: "${newConfig.instructions}"

Provide a clear, concise summary (1-3 sentences) of what changed. Focus on:
1. Instructions/behavior changes
2. Model or performance setting changes
3. Identity changes (name, intent, type)
4. Status changes

If no meaningful changes were detected, respond with "Minor configuration updates made."

Avoid mentioning technical parameter names - use user-friendly language.`;

    console.log('Calling Lovable AI Gateway with model: google/gemini-2.5-flash');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at analyzing AI agent configuration changes and explaining them in clear, user-friendly language.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 5000,
      }),
    });

    console.log('Lovable AI response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, response.statusText, errorText);
      throw new Error(`Lovable AI Gateway error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response data:', JSON.stringify(data, null, 2));
    
    const aiSummary = data.choices?.[0]?.message?.content?.trim();
    const finalSummary = aiSummary && aiSummary.length > 0
      ? aiSummary
      : computeFallbackChanges(originalConfig!, newConfig!);

    if (!aiSummary) {
      console.warn('Lovable AI returned empty content; using fallback diff summary.');
    }

    console.log('Change description:', finalSummary);

    return new Response(JSON.stringify({ whatChanged: finalSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in what_changed_in_agent function:', error);
    
    // Build a safe fallback diff so the UI still shows something meaningful
    let fallbackMessage = 'Agent configuration updated';
    try {
      if (originalConfig && newConfig) {
        fallbackMessage = computeFallbackChanges(originalConfig, newConfig);
      }
    } catch (_e) {
      // ignore fallback errors
    }
    
    return new Response(JSON.stringify({ 
      whatChanged: fallbackMessage,
      error: (error as Error).message 
    }), {
      status: 200, // Return 200 so the save process continues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});