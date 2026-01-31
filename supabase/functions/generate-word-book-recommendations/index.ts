import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

interface WordProgress {
  word_text: string;
  word_metadata: Record<string, unknown>;
  marked_at: string;
  sentence_context: string;
}

interface BookRecommendation {
  bookTitle: string;
  bookTheme: string;
  targetWords: string[];
  reasoning: string;
  educationalBenefit: string;
  estimatedDifficulty: 'easy' | 'medium' | 'challenging';
}

interface RecommendationRequest {
  kidProfileId: string;
  limit?: number;
}

Deno.serve(createHandler({
  name: 'generate-word-book-recommendations',
  clientMode: 'service',
  requireAuth: false,
  methods: ['POST'],
}, async ({ supabase, req }) => {
  const { kidProfileId, limit = 5 } = await parseBody<RecommendationRequest>(req);
  
  if (!kidProfileId) {
    return errors.badRequest('kidProfileId is required');
  }

  console.log('[Word Recommendations] Generating recommendations for kid:', kidProfileId);
  
  // Fetch difficult words from database (last 100)
  const { data: difficultWords, error: wordsError } = await supabase
    .from('word_learning_progress')
    .select('word_text, word_metadata, marked_at, sentence_context')
    .eq('kid_profile_id', kidProfileId)
    .eq('status', 'difficult')
    .order('marked_at', { ascending: false })
    .limit(100);
  
  if (wordsError) {
    console.error('[Word Recommendations] Error fetching words:', wordsError);
    throw wordsError;
  }

  if (!difficultWords || difficultWords.length === 0) {
    console.log('[Word Recommendations] No difficult words found');
    return successResponse({
      success: true,
      recommendations: [],
      metadata: {
        totalDifficultWords: 0,
        message: 'No difficult words yet. Keep reading to build your vocabulary!',
        analysisDate: new Date().toISOString()
      }
    });
  }

  console.log('[Word Recommendations] Found', difficultWords.length, 'difficult words');

  // Prepare AI prompt
  const uniqueWords = [...new Set(difficultWords.map((w: WordProgress) => w.word_text))];
  const wordList = uniqueWords.slice(0, 50).join(', ');

  const systemPrompt = `You are an educational book recommendation expert specializing in children's literacy. 
Based on a child's difficult words, suggest themed ABC book topics that will help them practice those words in engaging contexts.

Guidelines:
- Group related difficult words into themes (e.g., action verbs, animals, emotions, food)
- Suggest creative, age-appropriate book topics that children would find fun
- Explain why each book would help with their specific vocabulary challenges
- Focus on making learning enjoyable and engaging
- Include variety in difficulty levels
- Keep book titles short, catchy, and kid-friendly`;

  const userPrompt = `A child is struggling with these words: ${wordList}

Analyze these words and suggest ${limit} themed ABC book topics that would help them practice and master these vocabulary challenges. For each book, explain which words it addresses and why it would be effective for learning.`;

  // Define tool for structured output
  const tools = [{
    type: "function",
    function: {
      name: "suggest_word_practice_books",
      description: "Suggest themed ABC books based on difficult words",
      parameters: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                bookTitle: { type: "string", description: "Short, catchy title for the book" },
                bookTheme: { type: "string", description: "Main theme category" },
                targetWords: { type: "array", items: { type: "string" }, description: "5-10 specific difficult words this book will help practice" },
                reasoning: { type: "string", description: "2-3 sentences explaining why this book addresses their challenges" },
                educationalBenefit: { type: "string", description: "How this book will help them learn and remember these words" },
                estimatedDifficulty: { type: "string", enum: ["easy", "medium", "challenging"], description: "Difficulty level" }
              },
              required: ["bookTitle", "bookTheme", "targetWords", "reasoning", "educationalBenefit", "estimatedDifficulty"]
            }
          }
        },
        required: ["recommendations"]
      }
    }
  }];

  // Call Lovable AI
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  console.log('[Word Recommendations] Calling Lovable AI...');
  
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      tools: tools,
      tool_choice: { 
        type: "function", 
        function: { name: "suggest_word_practice_books" } 
      }
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[Word Recommendations] AI API error:', aiResponse.status, errorText);
    if (aiResponse.status === 429) {
      return errors.rateLimit('AI rate limit exceeded');
    }
    if (aiResponse.status === 402) {
      return errors.paymentRequired('AI credits exhausted');
    }
    throw new Error(`AI API error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  console.log('[Word Recommendations] AI response received');

  // Extract recommendations from tool call
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error('No tool call in AI response');
  }

  const recommendationsData = JSON.parse(toolCall.function.arguments);
  const recommendations: BookRecommendation[] = recommendationsData.recommendations;

  console.log('[Word Recommendations] Generated', recommendations.length, 'recommendations');

  return successResponse({
    success: true,
    recommendations,
    metadata: {
      totalDifficultWords: difficultWords.length,
      uniqueWords: uniqueWords.length,
      analysisDate: new Date().toISOString()
    }
  });
}));
