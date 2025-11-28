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
      name: "save_idea",
      description: "Save marketing content, personas, messaging docs, strategies, or campaign ideas to the database for future reference.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A short title for this content (e.g., 'Grandma Gail Persona', 'Instagram Campaign Ideas')"
          },
          content: {
            type: "string",
            description: "The full content to save (can be markdown formatted)"
          },
          category: {
            type: "string",
            description: "Optional category: 'persona', 'messaging', 'strategy', 'campaign', or leave empty"
          }
        },
        required: ["title", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_ideas",
      description: "List all saved marketing ideas and content. Optionally filter by category.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Optional category filter: 'persona', 'messaging', 'strategy', 'campaign'"
          }
        }
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

// Sanitize paths for GitHub API
function sanitizePath(path: string | undefined): string {
  if (!path || path === './' || path === '.' || path === '/') {
    return '';
  }
  // Strip leading ./ if present
  return path.replace(/^\.\//, '');
}

// Execute tool calls
async function executeTools(toolCalls: any[], supabase: any, userId: string) {
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
          
        case "save_idea":
          const { data: savedIdea, error: saveError } = await supabase
            .from('admin_ideas')
            .insert({
              user_id: userId,
              title: args.title,
              content: args.content,
              category: args.category || null
            })
            .select()
            .single();
          
          if (saveError) {
            result = { error: saveError.message };
          } else {
            result = { 
              success: true, 
              message: `Saved "${args.title}" successfully`,
              id: savedIdea.id 
            };
          }
          break;
          
        case "list_ideas":
          let query = supabase
            .from('admin_ideas')
            .select('id, title, category, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          if (args.category) {
            query = query.eq('category', args.category);
          }
          
          const { data: ideas, error: listError } = await query;
          
          if (listError) {
            result = { error: listError.message };
          } else {
            result = { 
              ideas,
              count: ideas?.length || 0 
            };
          }
          break;
          
        case "search_codebase":
          const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
          if (!GITHUB_TOKEN) {
            result = { error: "GitHub token not configured" };
            break;
          }
          
          // Use GitHub Code Search API
          const searchQuery = `${args.pattern} repo:jordanleahy/daily-abc-illustrations${args.file_pattern ? ` path:*${args.file_pattern}` : ''}`;
          const searchResponse = await fetch(
            `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=20`,
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Supabase-Edge-Function',
              }
            }
          );
          
          if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            result = { error: `GitHub API error: ${searchResponse.status} - ${errorText}` };
          } else {
            const searchData = await searchResponse.json();
            result = { 
              matches: searchData.items?.map((item: any) => ({
                path: item.path,
                repository: item.repository.full_name,
                url: item.html_url,
                score: item.score
              })) || [],
              total_count: searchData.total_count || 0
            };
          }
          break;
          
        case "read_file":
          const githubToken = Deno.env.get('GITHUB_TOKEN');
          if (!githubToken) {
            result = { error: "GitHub token not configured" };
            break;
          }
          
          // Sanitize path for GitHub API
          const cleanFilePath = sanitizePath(args.file_path);
          
          // Fetch file content from GitHub
          const fileResponse = await fetch(
            `https://api.github.com/repos/jordanleahy/daily-abc-illustrations/contents/${cleanFilePath}?ref=main`,
            {
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Supabase-Edge-Function',
              }
            }
          );
          
          if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            result = { error: `GitHub API error: ${fileResponse.status} - ${errorText}` };
          } else {
            const fileData = await fileResponse.json();
            
            // Check if it's a file (not a directory)
            if (fileData.type === 'file' && fileData.content) {
              // Decode base64 content
              const decodedContent = atob(fileData.content.replace(/\n/g, ''));
              result = { 
                path: fileData.path,
                content: decodedContent,
                size: fileData.size,
                url: fileData.html_url
              };
            } else {
              result = { error: "Path is not a file or content not available" };
            }
          }
          break;
          
        case "list_directory":
          const ghToken = Deno.env.get('GITHUB_TOKEN');
          if (!ghToken) {
            result = { error: "GitHub token not configured" };
            break;
          }
          
          // Sanitize path for GitHub API
          const cleanDirPath = sanitizePath(args.path);
          
          // Build correct GitHub API URL - root directory needs special handling
          // Empty path means root, which should be 'contents' not 'contents/'
          const githubPath = cleanDirPath ? `contents/${cleanDirPath}` : 'contents';
          
          // Fetch directory contents from GitHub
          const dirResponse = await fetch(
            `https://api.github.com/repos/jordanleahy/daily-abc-illustrations/${githubPath}?ref=main`,
            {
              headers: {
                'Authorization': `Bearer ${ghToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Supabase-Edge-Function',
              }
            }
          );
          
          if (!dirResponse.ok) {
            const errorText = await dirResponse.text();
            result = { error: `GitHub API error: ${dirResponse.status} - ${errorText}` };
          } else {
            const dirData = await dirResponse.json();
            
            // Check if it's an array (directory listing)
            if (Array.isArray(dirData)) {
              result = { 
                path: args.path || '/',
                items: dirData.map((item: any) => ({
                  name: item.name,
                  path: item.path,
                  type: item.type,
                  size: item.size,
                  url: item.html_url
                }))
              };
            } else {
              result = { error: "Path is not a directory" };
            }
          }
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
const MAX_TOOL_ITERATIONS = 5; // Safety limit to prevent infinite loops
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a helpful marketing agent for Chairlift Habits, an AI-powered educational platform that creates personalized books for children with progress tracking and rewards to build lasting reading habits. Your goal is to help the founder execute small, tangible marketing wins.

IMPORTANT MINDSET:
- The founder is still figuring things out - keep suggestions SMALL and CONCRETE
- Focus on actions that can be completed in 1-2 hours maximum
- Prioritize quick wins over grand strategies
- Think "what can we do TODAY?" not "what's the 6-month roadmap?"
- Break down big ideas into tiny first steps
- Don't query the database unless specifically asked - focus on actionable advice first

RESPONSE APPROACH:
- Start with the smallest possible action (e.g., "draft one Instagram caption" not "create Instagram strategy")
- Provide specific examples, templates, or exact copy when possible
- Suggest testing ONE thing before committing to a campaign
- Focus on free or low-cost tactics
- Keep responses conversational and brief

CODEBASE ACCESS:
- You have FULL access to the GitHub repository (jordanleahy/daily-abc-illustrations)
- Use list_directory tool to browse folders (use "." or "/" for root directory)
- Use read_file tool to read any file content
- Use search_codebase tool to find patterns across files
- When asked about the codebase, features, or code - USE THESE TOOLS proactively
- The GitHub path is: jordanleahy/daily-abc-illustrations

CONTENT STORAGE:
- You can save important marketing content using the save_idea tool
- Use this for personas, messaging docs, campaign ideas, or strategies the founder wants to reference later
- Suggest saving content when you create something valuable (e.g., "Want me to save this persona for future reference?")
- You can list saved ideas with list_ideas tool to remind the founder what's been documented

CRITICAL RESPONSE FORMAT:
You MUST end EVERY response with 3-5 actionable next steps in [SUGGEST] blocks.

Format: [SUGGEST]option-id: Option Label[/SUGGEST]
- Each suggestion on its own line
- IDs should be kebab-case (e.g., "refine-caption", "draft-post", "save-this-content")
- Labels should be clear actions (e.g., "Refine This Caption", "Save This Persona")
- Make each option feel achievable RIGHT NOW

Example:
"Here's a draft Instagram caption you could post today: '[caption text]'

[SUGGEST]refine-caption: Refine This Caption
draft-another: Draft Another Post Idea
save-this-content: Save This for Later
check-best-time: Check Best Time to Post
something-else: Try Something Different[/SUGGEST]"

NEVER respond without including a [SUGGEST] block with actionable next steps.`;

    // First call: Check if AI wants to use tools
    const initialResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        tools: tools,
        tool_choice: 'auto',
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
    const choice = initialData.choices?.[0];
    
    // Track conversation for multi-turn tool calling
    let conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    let iteration = 0;
    let lastChoice = choice;

    // Multi-turn tool calling loop
    while (
      lastChoice?.message?.tool_calls && 
      lastChoice.message.tool_calls.length > 0 && 
      iteration < MAX_TOOL_ITERATIONS
    ) {
      iteration++;
      console.log(`Tool calling iteration ${iteration}:`, lastChoice.message.tool_calls.map(tc => tc.function.name));
      
      // Execute the tool calls
      const toolResults = await executeTools(lastChoice.message.tool_calls, supabase, user.id);
      console.log(`Iteration ${iteration} tool results:`, toolResults);
      
      // Add assistant message and tool results to conversation
      conversationMessages = [
        ...conversationMessages,
        lastChoice.message, // Assistant's tool call request
        ...toolResults.map(tr => ({
          role: 'tool',
          tool_call_id: tr.tool_call_id,
          content: tr.output
        }))
      ];
      
      // Make next call WITH tools enabled (non-streaming to check for more tool calls)
      const nextResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: conversationMessages,
          tools: tools,        // Include tools to allow more calls
          tool_choice: 'auto',
        }),
      });
      
      if (!nextResponse.ok) {
        const errorText = await nextResponse.text();
        console.error(`AI gateway error at iteration ${iteration}:`, nextResponse.status, errorText);
        return new Response(JSON.stringify({ error: 'AI gateway error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const nextData = await nextResponse.json();
      lastChoice = nextData.choices?.[0];
    }

    // Log if we hit the iteration limit
    if (iteration >= MAX_TOOL_ITERATIONS) {
      console.warn(`Hit max tool iterations (${MAX_TOOL_ITERATIONS})`);
    }

    // Now stream the final response (no more tool calls)
    if (iteration > 0) {
      // We went through tool loop, need to stream the final content
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: conversationMessages.concat([lastChoice.message]),
          stream: true,
        }),
      });
      
      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error('Final AI gateway error:', finalResponse.status, errorText);
        return new Response(JSON.stringify({ error: 'AI gateway error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(finalResponse.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }
    
    // No tool calls, stream the response directly
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const content = choice?.message?.content || '';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
    
    return new Response(stream, {
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
