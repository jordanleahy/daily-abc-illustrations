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

// Average bite sizes by food category
const BITE_SIZES: Record<string, { amount: number; unit: string }> = {
  'protein': { amount: 0.5, unit: 'oz' },
  'grain': { amount: 1, unit: 'tbsp' },
  'vegetable': { amount: 1, unit: 'tbsp' },
  'fruit': { amount: 1, unit: 'piece' },
  'dairy': { amount: 1, unit: 'oz' },
  'pizza': { amount: 1, unit: 'bite' }, // ~6-8 bites per slice for kids
  'other': { amount: 1, unit: 'tbsp' },
};

function getAgeGroup(age: number): string {
  if (age <= 3) return '2-3';
  if (age <= 8) return '4-8';
  return '9-12';
}

interface FoodItem {
  name: string;
  plateAmount: string;
  category: string;
  estimatedCalories?: number;
  estimatedBites?: number;
}

interface FoodAnalysis {
  foods: FoodItem[];
  plateDescription: string;
}

async function analyzeFood(imageBase64: string, age: number, apiKey: string): Promise<FoodAnalysis> {
  const ageGroup = getAgeGroup(age);
  const portionMultiplier = PORTION_MULTIPLIERS[ageGroup];

  const systemPrompt = `You are a child nutrition expert analyzing food plates based on the USDA Food Pyramid / MyPlate guidelines.

IMPORTANT: Only count foods from these USDA FOOD GROUPS that provide nutritional value:
1. GRAINS - bread, pasta, rice, cereal, tortillas, crackers
2. VEGETABLES - all cooked/raw veggies, potatoes, corn, peas
3. FRUITS - fresh fruits meant to be eaten (NOT garnishes like lemon wedges)
4. PROTEIN - meat, poultry, fish, eggs, beans, nuts, tofu
5. DAIRY - milk, cheese, yogurt

DO NOT COUNT as food items (these are 0 bites):
- Garnishes (lemon wedges, parsley, herb sprigs, decorative items)
- Condiments & sauces (ketchup, mayo, garlic sauce, dipping sauces, gravy)
- Seasonings & toppings (salt, pepper, herbs on top)
- Beverages
- Non-edible items

For a ${age}-year-old child, they should eat approximately ${Math.round(portionMultiplier * 100)}% of an adult serving.

Return a JSON object with this exact structure:
{
  "foods": [
    {
      "name": "Food item name",
      "plateAmount": "Amount on plate (e.g., '1 slice', '1/2 cup', '4 pieces')",
      "category": "protein|grain|vegetable|fruit|dairy",
      "estimatedCalories": number,
      "estimatedBites": number (child-sized bites for RECOMMENDED portion)
    }
  ],
  "excludedItems": ["list of items seen but not counted as bites (garnishes, sauces, etc.)"],
  "plateDescription": "Brief description focusing on the main nutritious foods"
}

Bite estimation for a ${age}-year-old (RECOMMENDED portion = ${Math.round(portionMultiplier * 100)}% of plate):
- Protein (fish, chicken, meat): 2-3 bites per oz of recommended portion
- Grains (pasta, rice, bread): 1 bite per tablespoon
- Vegetables: 1 bite per tablespoon
- Fruits: 1 bite per small piece
- Dairy: 2 bites per oz

Only calculate bites for the RECOMMENDED portion, not the full plate amount.`;

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
            { type: 'text', text: 'Analyze this food plate and return the JSON analysis.' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ],
      max_completion_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error:', response.status, errorText);
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse food analysis:', e, 'Content:', content);
    // Return a default response if parsing fails
    return {
      foods: [{ name: 'Food', plateAmount: '1 serving', category: 'other', estimatedBites: 10 }],
      plateDescription: 'Unable to fully analyze the plate'
    };
  }
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

    // Step 1: Analyze the food with vision model
    const analysis = await analyzeFood(imageBase64, age, apiKey);
    console.log('Food analysis complete:', analysis);

    // Calculate total bites
    const totalBites = analysis.foods.reduce((sum, food) => sum + (food.estimatedBites || 5), 0);

    // Step 2: Generate portion overlay image
    console.log('Generating portion image...');
    const portionImage = await generatePortionImage(imageBase64, age, analysis.foods, apiKey);

    // Build response
    const result = {
      originalImage: imageBase64,
      portionImage: portionImage,
      analysis: {
        foods: analysis.foods.map(f => ({
          name: f.name,
          plateAmount: f.plateAmount,
          recommendedAmount: `${Math.round(PORTION_MULTIPLIERS[getAgeGroup(age)] * 100)}% of plate amount`,
          bites: f.estimatedBites || 5,
          category: f.category,
        })),
        totalBites,
        plateDescription: analysis.plateDescription,
        childAge: age,
        portionPercentage: Math.round(PORTION_MULTIPLIERS[getAgeGroup(age)] * 100),
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
