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
  },
  {
    type: "function",
    function: {
      name: "semantic_search",
      description: "Search the vectorized codebase using semantic similarity. Use this when you need to find code related to a concept or feature, not just exact text matches.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language description of what you're looking for (e.g., 'chat message streaming', 'user authentication flow')"
          },
          threshold: {
            type: "number",
            description: "Similarity threshold (0.0-1.0). Default 0.3. Lower = more results but less relevant."
          }
        },
        required: ["query"]
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
          
        case "semantic_search":
          // Generate embedding for the search query
          const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
            body: { 
              text: args.query,
              storeInDB: false
            }
          });

          if (embeddingError || !embeddingData.success) {
            result = { error: embeddingError?.message || 'Failed to generate query embedding' };
            break;
          }

          // Search vectorized codebase
          const threshold = args.threshold || 0.3;
          const { data: searchResults, error: searchError } = await supabase
            .rpc('search_embeddings', {
              query_embedding: embeddingData.embedding,
              match_threshold: threshold,
              match_count: 5
            });

          if (searchError) {
            result = { error: searchError.message };
          } else {
            result = { 
              query: args.query,
              threshold,
              matches: searchResults?.map((r: any) => ({
                file: r.metadata?.file || 'unknown',
                similarity: Math.round(r.similarity * 100) + '%',
                preview: r.content?.substring(0, 200) + '...'
              })) || [],
              total_found: searchResults?.length || 0
            };
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
You have COMPLETE access to the GitHub repository: jordanleahy/daily-abc-illustrations

CRITICAL TOOL USAGE RULES:
- NEVER say "I don't have access" or "I cannot see"
- ALWAYS use tools immediately when asked about features, code, or the codebase
- These are READ-ONLY tools - they're safe to use proactively
- Don't ask permission - just use the tools

FEATURE DISCOVERY PATTERN:
When user asks "Tell me about [feature name]":
1. Try multiple search strategies if first search returns no results:
   - Search with variations: plural/singular, kebab-case, PascalCase
   - Example: "rewards" → try "reward|Reward|kid_reward|purchase"
2. If searches fail, try browsing directories: list_directory("src/components"), list_directory("src/pages")
3. Check database schema: read_file("src/integrations/supabase/types.ts")
4. Synthesize findings into clear explanation

HANDLING EMPTY SEARCH RESULTS:
- NEVER just stop responding when search returns no results
- Try 2-3 different search queries with variations
- If still nothing, say "I searched but didn't find [X]. Let me browse the codebase structure..."
- Then use list_directory or read database types to find related features

EXAMPLES:

User: "Tell me about the trick tracking feature"
Your response: [Search "trick|TrickGoal|tricks"] → [If empty, try "trick"] → [Read files found] → [Explain feature]

User: "How does book creation work?"
Your response: [Search "book-creation|google-create-book|BookCreation"] → [Read edge function and components] → [Explain workflow]

User: "How does our rewards feature work?"
Your response: [Search "reward|Reward|kid_reward"] → [If empty, check database types for reward tables] → [Read relevant files] → [Explain feature]

AVAILABLE TOOLS:
- list_directory(path): Browse folders (use "." or "/" for root)
- read_file(path): Read any file content
- search_codebase(query, include_patterns): Find patterns across files
- query_database(sql): Query the Supabase database (SELECT only)

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

    // Automatic codebase search detection and context injection
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const codebaseKeywords = ['feature', 'how does', 'what is', 'tell me about', 'explain', 'database', 'table', 'component', 'work', 'function', 'what are', 'show me'];
    const isCodebaseQuestion = codebaseKeywords.some(keyword => lastUserMessage.includes(keyword));
    
    let enrichedSystemPrompt = systemPrompt;
    
    if (isCodebaseQuestion && lastUserMessage.length > 10) {
      console.log('🔍 Detected codebase question, auto-searching...');
      
      // Extract key terms for search (remove common words)
      const searchTerms = lastUserMessage
        .replace(/\b(how|does|what|is|tell|me|about|explain|the|our|in|a|an|and|or|but|for|to|from|with|can|you|show)\b/g, '')
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      // Try multiple search strategies
      const searchQueries = [
        searchTerms.slice(0, 3).join('|'), // Main terms
        searchTerms[0], // First term alone
        searchTerms.map(t => t + 's').join('|'), // Plural variations
      ].filter(q => q && q.length > 3);
      
      let allResults: any[] = [];
      const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
      
      if (GITHUB_TOKEN && searchQueries.length > 0) {
        for (const query of searchQueries.slice(0, 2)) { // Try first 2 strategies
          try {
            const searchQuery = `${query} repo:jordanleahy/daily-abc-illustrations path:*.tsx OR path:*.ts`;
            const searchResponse = await fetch(
              `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=10`,
              {
                headers: {
                  'Authorization': `Bearer ${GITHUB_TOKEN}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'Supabase-Edge-Function',
                }
              }
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.items && searchData.items.length > 0) {
                allResults = allResults.concat(searchData.items.slice(0, 5));
                console.log(`✅ Found ${searchData.items.length} results for query: ${query}`);
                break; // Found results, stop searching
              }
            }
          } catch (error) {
            console.error('Auto-search error:', error);
          }
        }
        
        if (allResults.length > 0) {
          const contextInjection = `\n\n[AUTOMATIC CODEBASE CONTEXT - Found ${allResults.length} relevant files]
${allResults.map((item: any) => `- ${item.path} (${item.repository.full_name})`).join('\n')}

These files were automatically found based on the user's question. You should use read_file() to examine the most relevant ones and synthesize the information to answer the question.
[END AUTOMATIC CONTEXT]\n`;
          
          enrichedSystemPrompt = systemPrompt + contextInjection;
          console.log('✅ Injected context from auto-search');
        } else {
          console.log('⚠️ No results from auto-search, agent will use tools manually');
        }
      }
    }

    // First call: Check if AI wants to use tools
    const initialResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: enrichedSystemPrompt },
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
      { role: 'system', content: enrichedSystemPrompt },
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
        
        // If gateway fails after tools executed, try to salvage with a final response
        if (iteration > 0) {
          console.log('Gateway failed after tool execution, streaming fallback response');
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              const fallbackMsg = 'I encountered an error processing the tool results. The tools executed successfully, but I had trouble generating a response. Please try your question again.';
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackMsg } }] })}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          });
          return new Response(stream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
          });
        }
        
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
        
        // Stream a fallback message instead of failing completely
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const fallbackMsg = `I successfully executed the tools, but encountered an error generating the final response. Please try asking your question in a simpler way or break it into smaller questions.`;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackMsg } }] })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        });
        return new Response(stream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
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
