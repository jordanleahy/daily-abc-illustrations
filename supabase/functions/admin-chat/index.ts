import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define available tools for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "query_database",
      description: "Execute read-only SQL queries on the Supabase database. Use this to fetch data about books, pages, users, agents, habits, kids, etc.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The SQL SELECT query to execute (read-only)"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_codebase",
      description: "Search for patterns across the codebase using regex. Use this to find where specific functionality is implemented.",
      parameters: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The regex pattern to search for"
          },
          file_pattern: {
            type: "string",
            description: "Optional file pattern to limit search (e.g., '*.ts', '*.tsx')"
          }
        },
        required: ["pattern"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a specific file from the codebase",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The path to the file relative to project root"
          }
        },
        required: ["file_path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List files and directories in a specific path",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The directory path to list"
          }
        },
        required: ["path"]
      }
    }
  }
];

// Execute tool calls
async function executeTools(toolCalls: any[], supabase: any) {
  const results = [];
  
  for (const toolCall of toolCalls) {
    const { name, arguments: argsStr } = toolCall.function;
    const args = JSON.parse(argsStr);
    
    try {
      let result;
      
      switch (name) {
        case "query_database":
          const { data, error } = await supabase.rpc('execute_sql', { query_text: args.query });
          if (error) {
            result = { error: error.message };
          } else {
            result = { data, rowCount: data?.length || 0 };
          }
          break;
          
        case "search_codebase":
          // Note: This would require additional implementation or API access
          result = { message: "Code search not yet implemented - use read_file for specific files" };
          break;
          
        case "read_file":
          // Note: This would require additional implementation or API access
          result = { message: "File reading not yet implemented - please describe what you need" };
          break;
          
        case "list_directory":
          // Note: This would require additional implementation or API access
          result = { message: "Directory listing not yet implemented" };
          break;
          
        default:
          result = { error: "Unknown tool" };
      }
      
      results.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(result)
      });
    } catch (error) {
      results.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify({ error: error.message })
      });
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role using security definer function
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Error checking permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a helpful marketing agent for Daily ABC Illustrations, an AI-powered educational platform that creates personalized ABC books for children. Your goal is to help the founder execute small, tangible marketing wins.

IMPORTANT MINDSET:
- The founder is still figuring things out - keep suggestions SMALL and CONCRETE
- Focus on actions that can be completed in 1-2 hours maximum
- Prioritize quick wins over grand strategies
- Think "what can we do TODAY?" not "what's the 6-month roadmap?"
- Break down big ideas into tiny first steps

RESPONSE APPROACH:
- Start with the smallest possible action (e.g., "draft one Instagram caption" not "create Instagram strategy")
- Provide specific examples, templates, or exact copy when possible
- Suggest testing ONE thing before committing to a campaign
- Focus on free or low-cost tactics
- Validate ideas with data when available via database queries

CRITICAL RESPONSE FORMAT:
- After every response, provide 3-5 small, immediate next steps
- Format suggestions as: [SUGGEST]option-id: Option Label[/SUGGEST]
- Each suggestion should feel achievable RIGHT NOW
- Each suggestion should be on its own line within the [SUGGEST] block

Example response format:
"Here's a draft Instagram caption you could post today: '[caption text]'

What would you like to do next?
[SUGGEST]refine-caption: Refine This Caption
draft-another: Draft Another Post Idea
check-best-time: Check Best Time to Post
see-hashtags: Get Hashtag Suggestions
something-else: Try Something Different[/SUGGEST]"

You have access to the production database and codebase to provide data-driven insights. Always end responses with small, tangible suggestions.`;

    // First call: Check if AI wants to use tools
    const initialResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        tools: tools,
        stream: false, // Don't stream when waiting for tool calls
      }),
    });

    if (!initialResponse.ok) {
      if (initialResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (initialResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await initialResponse.text();
      console.error('AI gateway error:', initialResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const initialData = await initialResponse.json();
    const choice = initialData.choices[0];
    
    // Check if AI wants to use tools
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      console.log('AI requested tool calls:', choice.message.tool_calls);
      
      // Execute tools
      const toolResults = await executeTools(choice.message.tool_calls, supabase);
      
      // Second call: Send tool results back to AI
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            choice.message, // Include the assistant's tool call message
            ...toolResults.map(result => ({
              role: 'tool',
              tool_call_id: result.tool_call_id,
              content: result.output
            }))
          ],
          stream: true, // Now we can stream the final response
        }),
      });

      if (!finalResponse.ok) {
        if (finalResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (finalResponse.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await finalResponse.text();
        console.error('AI gateway error:', finalResponse.status, errorText);
        return new Response(JSON.stringify({ error: 'AI gateway error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(finalResponse.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }
    
    // No tool calls - return initial response as text
    return new Response(JSON.stringify({ 
      message: choice.message.content 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
