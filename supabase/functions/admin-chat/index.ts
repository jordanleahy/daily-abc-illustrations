import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Function to create a blog post in the database
async function createBlogPost(
  supabase: any,
  userId: string,
  params: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    seo_title: string;
    seo_description: string;
    tags?: string[];
  }
) {
  console.log('Creating blog post:', { slug: params.slug, title: params.title });
  
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      author_id: userId,
      title: params.title,
      slug: params.slug,
      content: params.content,
      excerpt: params.excerpt,
      seo_title: params.seo_title,
      seo_description: params.seo_description,
      tags: params.tags || [],
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create blog post:', error);
    throw error;
  }

  console.log('Blog post created successfully:', data.id);
  return data;
}

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
- A tool to create blog post drafts directly in the blog system

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
5. One example or template to get started

BLOG POST CREATION:
When the user asks you to draft a blog post or create blog content, use the create_blog_post tool to save it as a draft in the blog system. Always include:
- A compelling title optimized for grandparents searching for gift ideas
- SEO-friendly slug (lowercase, hyphens, no special characters)
- Engaging excerpt (150-160 characters)
- Complete markdown-formatted content
- SEO title (60 characters max)
- SEO description (155-160 characters)
- Relevant tags for categorization`;

// Define the blog post creation tool
const BLOG_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_blog_post",
      description: "Create a new blog post draft in the blog system. Use this when the user asks you to write or create a blog post.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The blog post title (compelling and search-friendly)"
          },
          slug: {
            type: "string",
            description: "URL-friendly slug (lowercase, hyphens, no special characters, e.g., 'gift-ideas-for-grandparents')"
          },
          content: {
            type: "string",
            description: "Full blog post content in markdown format"
          },
          excerpt: {
            type: "string",
            description: "Brief excerpt or summary (150-160 characters)"
          },
          seo_title: {
            type: "string",
            description: "SEO-optimized title (60 characters max)"
          },
          seo_description: {
            type: "string",
            description: "SEO meta description (155-160 characters)"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Array of relevant tags for categorization"
          }
        },
        required: ["title", "slug", "content", "excerpt", "seo_title", "seo_description"],
        additionalProperties: false
      }
    }
  }
];

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

    // Call Lovable AI Gateway with marketing system prompt and tools
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
        tools: BLOG_TOOLS,
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

    // Check if response is streaming or includes tool calls
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let toolCalls: any[] = [];
    let toolCallInProgress: any = null;
    let hasContent = false;

    // For streaming back to client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (let line of lines) {
              if (line.endsWith('\r')) line = line.slice(0, -1);
              if (line.startsWith(':') || line.trim() === '') continue;
              if (!line.startsWith('data: ')) continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                // If we collected tool calls, execute them
                if (toolCalls.length > 0) {
                  console.log('Tool calls detected:', toolCalls.length);
                  for (const toolCall of toolCalls) {
                    if (toolCall.function?.name === 'create_blog_post') {
                      try {
                        const args = JSON.parse(toolCall.function.arguments);
                        const blogPost = await createBlogPost(supabase, user.id, args);
                        
                        // Send success message back through stream
                        const successMessage = `\n\n✅ Blog post created successfully! "${blogPost.title}" has been saved as a draft. You can edit and publish it at /blog/admin`;
                        const encoded = new TextEncoder().encode(`data: ${JSON.stringify({
                          choices: [{ delta: { content: successMessage } }]
                        })}\n\n`);
                        controller.enqueue(encoded);
                      } catch (error) {
                        console.error('Tool execution error:', error);
                        const errorMessage = `\n\n❌ Failed to create blog post: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        const encoded = new TextEncoder().encode(`data: ${JSON.stringify({
                          choices: [{ delta: { content: errorMessage } }]
                        })}\n\n`);
                        controller.enqueue(encoded);
                      }
                    }
                  }
                }
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta;
                
                // Check for tool calls in delta
                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    if (tc.index !== undefined) {
                      if (!toolCallInProgress || toolCallInProgress.index !== tc.index) {
                        if (toolCallInProgress) {
                          toolCalls.push(toolCallInProgress);
                        }
                        toolCallInProgress = { 
                          index: tc.index,
                          id: tc.id || `call_${tc.index}`,
                          type: 'function',
                          function: { name: '', arguments: '' }
                        };
                      }
                      if (tc.function?.name) {
                        toolCallInProgress.function.name += tc.function.name;
                      }
                      if (tc.function?.arguments) {
                        toolCallInProgress.function.arguments += tc.function.arguments;
                      }
                    }
                  }
                }
                
                // Stream regular content
                if (delta?.content) {
                  hasContent = true;
                  controller.enqueue(new TextEncoder().encode(`data: ${jsonStr}\n\n`));
                }
              } catch (e) {
                console.error('Failed to parse SSE chunk:', e);
              }
            }
          }

          // Finalize any in-progress tool call
          if (toolCallInProgress) {
            toolCalls.push(toolCallInProgress);
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
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
