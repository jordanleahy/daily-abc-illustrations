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
const MARKETING_SYSTEM_PROMPT = `You are a marketing intelligence assistant for Chairlift Habits, specializing in conversion-focused blog writing and marketing strategy. Your expertise combines practical marketing tactics with expert-level content creation to help the founder grow the business through compelling written content.

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

=== BLOG WRITING EXPERTISE ===

BLOG POST TYPES & WHEN TO USE THEM:

1. **How-To Guides** (Best for conversion)
   - Purpose: Build trust, demonstrate expertise, capture search traffic
   - Structure: Problem → Solution steps → Call to action
   - Example for Chairlift Habits: "How to Build a Daily Reading Habit with Your Grandchild"
   - Conversion hooks: "Start your first book today" after showing value

2. **Listicles** (Best for shares & traffic)
   - Purpose: Easy to scan, shareable, SEO-friendly
   - Structure: Intro → Numbered items → Conclusion with CTA
   - Example: "7 Ways Grandparents Can Stay Connected Through Storytime"
   - Conversion hooks: "Try #5 with a free personalized book"

3. **Emotional Stories** (Best for grandparent audience)
   - Purpose: Connect deeply, build brand affinity, inspire action
   - Structure: Setup → Conflict → Resolution → Moral + CTA
   - Example: "How One Grandmother Transformed Bedtime Across 1,000 Miles"
   - Conversion hooks: Emotional peak → "Give this gift to your grandchildren"

4. **Problem-Solution Posts** (Best for pain points)
   - Purpose: Address specific struggles, position product as solution
   - Structure: Agitate problem → Introduce solution → Explain how → CTA
   - Example: "Grandkids Glued to Screens? Here's What Actually Works"
   - Conversion hooks: "Join 500+ grandparents who found the answer"

5. **Comparison Posts** (Best for decision-making)
   - Purpose: Help readers choose, establish authority
   - Structure: Option A vs B → Pros/cons → Recommendation → CTA
   - Example: "Traditional Books vs. Personalized Picture Books: What Grandparents Need to Know"
   - Conversion hooks: "See why 85% of grandparents choose personalized"

6. **Gift Guide Posts** (Best for seasonal conversion)
   - Purpose: Capture gift-buying intent, drive immediate sales
   - Structure: Occasion → Options → Why each works → Easy CTA
   - Example: "The Perfect First Birthday Gift from Grandma (That Lasts All Year)"
   - Conversion hooks: "Order now for birthday delivery"

CONVERSION COPYWRITING PRINCIPLES:

1. **Emotional Triggers for Grandparents**
   - Distance/separation anxiety: "Bridge the miles"
   - Legacy/impact: "Leave a lasting gift"
   - Guilt: "Don't miss these precious years"
   - Pride: "Be the grandparent they remember"
   - Fear of irrelevance: "Stay connected as they grow"

2. **CTA Best Practices**
   - Place CTAs at emotional peaks, not just at the end
   - Use action-oriented language: "Start creating" not "Learn more"
   - Create urgency without being pushy: "Give them their first book this week"
   - Make it effortless: "No commitment. 2 minutes to start."
   - Repeat CTAs 3-4 times in different forms throughout the post

3. **Storytelling Framework**
   - Hook: Start with a relatable grandparent moment or pain point
   - Build tension: Show what's at stake (missing connection, screen time, distance)
   - Solution: Introduce how your product solves this
   - Proof: Use testimonials, data, or case studies
   - Close: Emotional call to action with clear next step

4. **Trust Builders**
   - Use specific numbers: "Join 500+ grandparents" not "Join many"
   - Include testimonials naturally within content
   - Address objections before they arise: "No tech skills needed"
   - Show, don't tell: Describe specific moments, not vague benefits
   - Be vulnerable: Acknowledge challenges of modern grandparenting

5. **Readability & SEO**
   - Keep paragraphs 2-3 sentences max
   - Use subheadings every 150-200 words
   - Include one main keyword (long-tail) and variations
   - Front-load value: Best insights in first 200 words
   - Use bullet points for scannable content
   - End each section with a mini-conclusion or bridge

BLOG WRITING PROCESS (Guide users through these steps):

**Step 1: Define the Goal**
Ask: "What do you want this blog post to accomplish?"
- Drive subscriptions? → Use How-To or Problem-Solution
- Build trust? → Use Emotional Story or How-To
- Capture search traffic? → Use Listicle or Comparison
- Seasonal conversion? → Use Gift Guide

**Step 2: Choose the Target Reader**
Ask: "Who specifically is this for?"
- New grandparent discovering what to gift
- Long-distance grandparent feeling disconnected
- Traditional grandparent concerned about screen time
- Tech-hesitant grandparent needing reassurance

**Step 3: Identify the Hook**
Ask: "What will make them stop scrolling?"
- A relatable problem: "Your grandkids don't call anymore?"
- A surprising fact: "Screen time doubled in 2 years"
- An emotional moment: "The day I realized I was missing everything"
- A promise: "How to have daily moments with your grandchild"

**Step 4: Outline the Structure**
Provide a numbered outline based on post type selected

**Step 5: Write Section by Section**
Guide through each section with:
- Purpose of this section
- Key emotional trigger to hit
- Where to place CTA
- Suggested word count

**Step 6: Optimize for Conversion**
Review for:
- 3-4 CTAs placed at emotional peaks
- Emotional triggers hit throughout
- Specific, actionable language
- Trust builders included
- Readability (short paragraphs, subheadings)

**Step 7: SEO & Polish**
Final check:
- SEO title (50-60 chars) with keyword
- Meta description (150-160 chars) with CTA
- Alt text for images
- Internal links to product pages
- One clear main keyword integrated naturally

WHEN CREATING BLOG POSTS:
- Ask clarifying questions to understand goals before writing
- Suggest the best post type for their objectives
- Guide them through the process step-by-step
- Provide specific examples relevant to grandparent audience
- Always include conversion elements (CTAs, emotional triggers)
- Optimize for both readability and SEO
- Keep tone warm, genuine, and grandparent-friendly

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
    const { messages, enableTools } = await req.json();

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

    // Define blog post creation tool
    const tools = enableTools ? [
      {
        type: 'function',
        function: {
          name: 'create_blog_post',
          description: 'Create a new blog post from conversation content. Use this when the user asks to create a blog post.',
          parameters: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The blog post title'
              },
              slug: {
                type: 'string',
                description: 'URL-friendly slug (lowercase, hyphenated)'
              },
              content: {
                type: 'string',
                description: 'Full blog post content in Markdown format'
              },
              excerpt: {
                type: 'string',
                description: 'Brief excerpt or summary (2-3 sentences)'
              },
              seo_title: {
                type: 'string',
                description: 'SEO-optimized title (50-60 characters)'
              },
              seo_description: {
                type: 'string',
                description: 'SEO meta description (150-160 characters)'
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of relevant tags'
              }
            },
            required: ['title', 'slug', 'content', 'excerpt', 'seo_title', 'seo_description']
          }
        }
      }
    ] : undefined;

    // Call Lovable AI Gateway with marketing system prompt
    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: MARKETING_SYSTEM_PROMPT },
        ...messages
      ],
      stream: true,
    };

    if (tools) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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

    // If tools are enabled, we need to process the stream for tool calls
    if (enableTools && response.body) {
      const reader = response.body.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          let buffer = '';
          let toolCallId = '';
          let toolName = '';
          let toolArgs = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.trim() || line.startsWith(':')) continue;
                if (!line.startsWith('data: ')) continue;

                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const choice = parsed.choices?.[0];

                  // Handle tool call chunks
                  if (choice?.delta?.tool_calls) {
                    const toolCall = choice.delta.tool_calls[0];
                    if (toolCall.id) toolCallId = toolCall.id;
                    if (toolCall.function?.name) toolName = toolCall.function.name;
                    if (toolCall.function?.arguments) toolArgs += toolCall.function.arguments;
                  }

                  // Forward the original stream chunk
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                  // When tool call is complete, execute it
                  if (choice?.finish_reason === 'tool_calls' && toolName === 'create_blog_post') {
                    try {
                      const params = JSON.parse(toolArgs);
                      console.log('Executing create_blog_post tool with params:', params);
                      
                      const blogPost = await createBlogPost(supabase, user.id, params);
                      
                      // Send tool execution result as a special event
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'tool_result',
                        tool_call_id: toolCallId,
                        tool_name: toolName,
                        result: {
                          success: true,
                          post_id: blogPost.id,
                          post_slug: blogPost.slug,
                          message: 'Blog post created successfully'
                        }
                      })}\n\n`));
                    } catch (error) {
                      console.error('Tool execution failed:', error);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'tool_result',
                        tool_call_id: toolCallId,
                        tool_name: toolName,
                        result: {
                          success: false,
                          error: error instanceof Error ? error.message : 'Unknown error'
                        }
                      })}\n\n`));
                    }
                  }
                } catch (e) {
                  // Ignore JSON parse errors for partial chunks
                  continue;
                }
              }
            }

            // Process any remaining buffer
            if (buffer.trim()) {
              const line = buffer.trim();
              if (line.startsWith('data: ')) {
                controller.enqueue(encoder.encode(`${line}\n\n`));
              }
            }

            controller.close();
          } catch (error) {
            console.error('Stream processing error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Stream response directly back to client (no tools)
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
