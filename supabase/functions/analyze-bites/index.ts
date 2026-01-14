import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// USDA-based portion guidelines by age group
const PORTION_MULTIPLIERS: Record<string, number> = {
  '2-3': 0.25,   // 25% of adult serving
  '4-8': 0.5,    // 50% of adult serving
  '9-12': 0.75, // 75% of adult serving
};

// Texture-based bite modifiers - tough foods need smaller bites
const TEXTURE_MODIFIERS: Record<string, { modifier: number; examples: string }> = {
  soft: { modifier: 1.0, examples: 'pasta, rice, mashed potatoes, yogurt, eggs, soft cheese' },
  medium: { modifier: 0.85, examples: 'chicken, fish, bread, pancakes, soft fruits, beans' },
  tough: { modifier: 0.65, examples: 'steak, raw carrots, celery, hard apples, tough meat' },
  mixed: { modifier: 0.9, examples: 'casseroles, stir-fry, mixed dishes, pizza' },
};

function getAgeGroup(age: number): string {
  if (age <= 3) return '2-3';
  if (age <= 8) return '4-8';
  return '9-12';
}

interface FoodItem {
  name: string;
  plateAmount: string;
  category: 'protein' | 'grain' | 'vegetable' | 'fruit' | 'dairy';
  texture: 'soft' | 'medium' | 'tough' | 'mixed';
  estimatedCalories?: number;
  estimatedBites: number;
  confidence: number;
}

interface FoodAnalysis {
  foods: FoodItem[];
  excludedItems: string[];
  plateDescription: string;
  overallConfidence: number;
}

// Tool definition for structured output
const getAnalyzeToolDefinition = (age: number, portionPercentage: number) => ({
  type: "function",
  function: {
    name: "analyze_plate",
    description: `Analyze a child's food plate and estimate portion-appropriate bites for a ${age}-year-old (${portionPercentage}% of adult serving)`,
    parameters: {
      type: "object",
      properties: {
        foods: {
          type: "array",
          description: "List of nutritional food items on the plate (USDA food groups only)",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Food item name" },
              plateAmount: { type: "string", description: "Amount visible on plate (e.g., '1 slice', '1/2 cup', '4 pieces')" },
              category: { 
                type: "string", 
                enum: ["protein", "grain", "vegetable", "fruit", "dairy"],
                description: "USDA food group category"
              },
              texture: {
                type: "string",
                enum: ["soft", "medium", "tough", "mixed"],
                description: "Food texture affecting bite size: soft (pasta, rice), medium (chicken, bread), tough (steak, raw carrots), mixed (casseroles)"
              },
              estimatedCalories: { type: "integer", description: "Estimated calories for the plate amount" },
              estimatedBites: { 
                type: "integer", 
                description: `Number of child-sized bites for the RECOMMENDED portion (${portionPercentage}% of plate amount)` 
              },
              confidence: { 
                type: "number", 
                minimum: 0, 
                maximum: 1,
                description: "Confidence in food identification: 0.9+ for clear items, 0.5-0.8 for partially visible/uncertain"
              }
            },
            required: ["name", "plateAmount", "category", "texture", "estimatedBites", "confidence"],
            additionalProperties: false
          }
        },
        excludedItems: {
          type: "array",
          items: { type: "string" },
          description: "Items seen but not counted as bites (garnishes, sauces, condiments, beverages)"
        },
        plateDescription: { 
          type: "string", 
          description: "Brief description of the main nutritious foods on the plate"
        }
      },
      required: ["foods", "excludedItems", "plateDescription"],
      additionalProperties: false
    }
  }
});

async function analyzeFood(imageBase64: string, age: number, apiKey: string): Promise<FoodAnalysis> {
  const ageGroup = getAgeGroup(age);
  const portionMultiplier = PORTION_MULTIPLIERS[ageGroup];
  const portionPercentage = Math.round(portionMultiplier * 100);

  const systemPrompt = `You are a child nutrition expert analyzing food plates based on USDA MyPlate guidelines.

ONLY count foods from these USDA FOOD GROUPS:
1. GRAINS - bread, pasta, rice, cereal, tortillas, crackers
2. VEGETABLES - all cooked/raw veggies, potatoes, corn, peas
3. FRUITS - fresh fruits meant to be eaten (NOT decorative garnishes)
4. PROTEIN - meat, poultry, fish, eggs, beans, nuts, tofu
5. DAIRY - milk, cheese, yogurt

DO NOT COUNT (list these in excludedItems):
- Garnishes (lemon wedges, parsley, herb sprigs, decorative items)
- Condiments & sauces (ketchup, mayo, garlic sauce, dipping sauces, gravy, tartar sauce)
- Seasonings & toppings (salt, pepper, herbs sprinkled on top)
- Beverages
- Non-edible items

TEXTURE CLASSIFICATION:
- soft: pasta, rice, mashed potatoes, yogurt, eggs, soft cheese
- medium: chicken, fish, bread, pancakes, soft fruits, beans
- tough: steak, raw carrots, celery, hard apples, tough meat
- mixed: casseroles, stir-fry, mixed dishes, pizza

BITE ESTIMATION for ${age}-year-old (${portionPercentage}% of plate = recommended portion):
- Protein: 2-3 bites per oz of recommended portion
- Grains: 1 bite per tablespoon
- Vegetables: 1 bite per tablespoon
- Fruits: 1 bite per small piece
- Dairy: 2 bites per oz

CONFIDENCE SCORING:
- 0.9-1.0: Clearly visible, easy to identify
- 0.7-0.89: Mostly visible, confident identification
- 0.5-0.69: Partially obscured or uncertain`;

  const toolDefinition = getAnalyzeToolDefinition(age, portionPercentage);

  const response = await fetch(LOVABLE_AI_GATEWAY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this food plate for the child using the analyze_plate function.' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ],
      tools: [toolDefinition],
      tool_choice: { type: "function", function: { name: "analyze_plate" } },
      max_completion_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error:', response.status, errorText);
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract structured data from tool call
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.name === 'analyze_plate') {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      
      // Calculate overall confidence from individual food confidences
      const overallConfidence = args.foods.length > 0
        ? args.foods.reduce((sum: number, f: FoodItem) => sum + f.confidence, 0) / args.foods.length
        : 0;
      
      return {
        foods: args.foods || [],
        excludedItems: args.excludedItems || [],
        plateDescription: args.plateDescription || 'Food plate',
        overallConfidence: Math.round(overallConfidence * 100) / 100,
      };
    } catch (e) {
      console.error('Failed to parse tool call arguments:', e, 'Raw:', toolCall.function.arguments);
    }
  }
  
  // Fallback: try to extract from regular content if tool calling failed
  const content = data.choices?.[0]?.message?.content || '';
  console.log('Tool calling may have failed, content:', content);
  
  // Return a default response if parsing fails
  return {
    foods: [{ 
      name: 'Food', 
      plateAmount: '1 serving', 
      category: 'protein' as const, 
      texture: 'medium' as const,
      estimatedBites: 10,
      confidence: 0.5
    }],
    excludedItems: [],
    plateDescription: 'Unable to fully analyze the plate',
    overallConfidence: 0.5,
  };
}

async function generatePortionImage(
  imageBase64: string,
  age: number,
  foods: FoodItem[],
  apiKey: string
): Promise<string | null> {
  const ageGroup = getAgeGroup(age);
  const portionMultiplier = PORTION_MULTIPLIERS[ageGroup];
  
  const foodDescriptions = foods.map(f => 
    `- ${f.name}: eat ${Math.round(portionMultiplier * 100)}% of what's shown`
  ).join('\n');

  const prompt = `This is a photo of food on a plate for a ${age}-year-old child.

The child should eat approximately ${Math.round(portionMultiplier * 100)}% of the food shown:
${foodDescriptions}

Edit this image to clearly show the recommended portion:
- Draw a bright, friendly GREEN outline or highlight around ONLY the portion the child should eat
- If only part of an item should be eaten (like half a pizza slice), show a clear visual dividing line
- Add a small, child-friendly text label saying "Eat this much!" near the highlighted portion
- Keep the rest of the food visible but slightly faded or grayed out
- Make it very clear and encouraging - this is for parents to show their child

The goal is to make it visually obvious which part of the plate the child should finish.`;

  try {
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return generatedImage || null;
  } catch (e) {
    console.error('Image generation failed:', e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, childAge } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const age = parseInt(childAge) || 4;
    if (age < 2 || age > 12) {
      return new Response(
        JSON.stringify({ error: 'Age must be between 2 and 12' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing plate for ${age}-year-old child...`);

    // Step 1: Analyze the food with vision model using tool calling
    const analysis = await analyzeFood(imageBase64, age, apiKey);
    console.log('Food analysis complete:', JSON.stringify(analysis, null, 2));

    // Apply texture modifiers to bite calculation
    const processedFoods = analysis.foods.map(food => {
      const textureInfo = TEXTURE_MODIFIERS[food.texture] || TEXTURE_MODIFIERS.medium;
      const adjustedBites = Math.max(1, Math.round(food.estimatedBites * textureInfo.modifier));
      
      return {
        name: food.name,
        plateAmount: food.plateAmount,
        recommendedAmount: `${Math.round(PORTION_MULTIPLIERS[getAgeGroup(age)] * 100)}% of plate amount`,
        bites: adjustedBites,
        category: food.category,
        texture: food.texture,
        confidence: food.confidence,
      };
    });

    // Calculate total bites from processed foods
    const totalBites = processedFoods.reduce((sum, food) => sum + food.bites, 0);

    // Step 2: Generate portion overlay image
    console.log('Generating portion image...');
    const portionImage = await generatePortionImage(imageBase64, age, analysis.foods, apiKey);

    // Build response with enhanced data
    const result = {
      originalImage: imageBase64,
      portionImage: portionImage,
      analysis: {
        foods: processedFoods,
        totalBites,
        plateDescription: analysis.plateDescription,
        childAge: age,
        portionPercentage: Math.round(PORTION_MULTIPLIERS[getAgeGroup(age)] * 100),
        excludedItems: analysis.excludedItems,
        overallConfidence: analysis.overallConfidence,
      },
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('analyze-bites error:', error);
    
    // Handle rate limiting
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('rate')) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (error.message.includes('402') || error.message.includes('payment')) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
