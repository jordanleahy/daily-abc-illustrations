import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🚀 vectorize-codebase function starting...');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: 'GITHUB_TOKEN not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { filePaths } = await req.json();

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'filePaths array required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const results = [];

    for (const filePath of filePaths) {
      console.log(`📄 Processing file: ${filePath}`);
      
      try {
        // Read file from GitHub
        const fileResponse = await fetch(
          `https://api.github.com/repos/jordanleahy/daily-abc-illustrations/contents/${filePath}?ref=main`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Supabase-Edge-Function',
            }
          }
        );

        if (!fileResponse.ok) {
          console.error(`❌ Failed to read ${filePath}: ${fileResponse.status}`);
          results.push({ filePath, success: false, error: `GitHub API error: ${fileResponse.status}` });
          continue;
        }

        const fileData = await fileResponse.json();

        if (fileData.type !== 'file' || !fileData.content) {
          results.push({ filePath, success: false, error: 'Not a file or content unavailable' });
          continue;
        }

        // Decode base64 content
        const decodedContent = atob(fileData.content.replace(/\n/g, ''));
        const textContent = `File: ${filePath}\n\n${decodedContent}`;

        console.log(`📝 Content length for ${filePath}: ${decodedContent.length} chars`);

        // Generate embedding via generate-embeddings function
        const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
          body: {
            text: textContent,
            metadata: { type: 'codebase', file: filePath, size: fileData.size },
            storeInDB: true
          }
        });

        if (embeddingError || !embeddingData?.success) {
          console.error(`❌ Embedding failed for ${filePath}:`, embeddingError);
          results.push({ filePath, success: false, error: 'Embedding generation failed' });
          continue;
        }

        console.log(`✅ Successfully vectorized ${filePath}`);
        results.push({ 
          filePath, 
          success: true, 
          embeddingId: embeddingData.id,
          size: fileData.size 
        });

      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error);
        results.push({ filePath, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in vectorize-codebase function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
