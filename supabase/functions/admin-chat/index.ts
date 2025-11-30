import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Marketing intelligence system prompt
const MARKETING_SYSTEM_PROMPT = `You are a marketing intelligence assistant for Chairlift Habits, helping the founder develop effective marketing strategies. Your role is to provide small, tangible, immediately actionable marketing steps that can be completed in 1-2 hours.

CRITICAL CONTEXT:
- Product: Chairlift Habits - personalized AI picture books for toddlers/preschoolers (ages 1-5)
- Primary Target: Grandparents who gift subscriptions to families with young children
- Value Proposition: Stay connected from anywhere, build reading habits, share special moments
- Domain: chairlifthabits.com (formerly dailyabcillustrations.com)
- Support: support@chairlifthabits.com
- Current Stage: Founder still figuring things out, needs realistic achievable actions

YOUR APPROACH:
- Prioritize quick wins and practical advice suitable for a solo founder
- Suggest specific examples and templates rather than grand strategies
- Recommend testing one thing at a time
- Focus on channels grandparents actually use (Facebook, email, personal networks)
- Keep advice grounded in reality - no "build a massive campaign" suggestions
- When suggesting content, consider the grandparent-to-grandchild emotional angle
- Emphasize gift-giving, connection, and ease of use in all marketing messaging

YOU HAVE ACCESS TO:
- The codebase (to understand product features and technical capabilities)
- Current marketing copy and landing pages
- Product documentation

FORBIDDEN:
- Never suggest strategies requiring large budgets or teams
- Don't recommend complex automation or technical marketing stacks
- Avoid generic marketing advice without specific actionable steps
- Don't assume the founder has experience with advanced marketing tools

When asked about specific marketing tactics, provide:
1. Why it matters for this specific business
2. Exact steps to implement (in numbered list)
3. What success looks like (specific metrics)
4. Time estimate (be realistic - usually 1-2 hours)
5. One example or template to get started`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user is admin using has_role function
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      console.error('Admin verification failed:', roleError);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Lovable AI Gateway with marketing system prompt
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: MARKETING_SYSTEM_PROMPT },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream response back to client
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Admin chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
