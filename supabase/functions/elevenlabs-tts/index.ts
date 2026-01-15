import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlignmentData {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

// Extract words from original text (without SSML tags)
function extractOriginalWords(text: string): string[] {
  return text.match(/[a-zA-Z0-9''-]+/g) || [];
}

// Convert character-level alignment to word-level timing
// Uses original text for word list, alignment data for timing
function getWordTimings(originalText: string, alignment: AlignmentData): WordTiming[] {
  const originalWords = extractOriginalWords(originalText);
  const characters = alignment.characters;
  const startTimes = alignment.character_start_times_seconds;
  const endTimes = alignment.character_end_times_seconds;
  
  const words: WordTiming[] = [];
  let originalWordIndex = 0;
  let currentWord = '';
  let wordStartTime = 0;
  let wordEndTime = 0;
  let inWord = false;
  let inTag = false;
  
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    
    // Skip SSML tag characters
    if (char === '<') {
      inTag = true;
      continue;
    }
    if (char === '>') {
      inTag = false;
      continue;
    }
    if (inTag) continue;
    
    const isWordChar = /[a-zA-Z0-9''-]/.test(char);
    
    if (isWordChar) {
      if (!inWord) {
        inWord = true;
        wordStartTime = startTimes[i];
        currentWord = char;
      } else {
        currentWord += char;
      }
      wordEndTime = endTimes[i];
    } else {
      if (inWord && currentWord.trim()) {
        // Map to original word (preserves "ph" instead of just the spoken characters)
        if (originalWordIndex < originalWords.length) {
          words.push({
            word: originalWords[originalWordIndex],
            startTime: wordStartTime,
            endTime: wordEndTime,
          });
          originalWordIndex++;
        }
        currentWord = '';
        inWord = false;
      }
    }
  }
  
  // Don't forget the last word
  if (inWord && currentWord.trim() && originalWordIndex < originalWords.length) {
    words.push({
      word: originalWords[originalWordIndex],
      startTime: wordStartTime,
      endTime: wordEndTime,
    });
  }
  
  return words;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Default to Lily voice - soft, gentle voice ideal for children's books
    const { text, voiceId = 'pFZP5JQG7iQjIQuC4Bku', withTimestamps = false } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add educational lead-up for isolated "ph" digraphs:
    // Spell out the letters individually using IPA for letter names, then pronounce the sound
    // "p" = /piː/ (pee), "h" = /eɪtʃ/ (aitch), then "makes the sound" + /f/
    const phLeadUp = '<break time="300ms"/><phoneme alphabet="ipa" ph="piː">p</phoneme><break time="300ms"/><phoneme alphabet="ipa" ph="eɪtʃ">h</phoneme><break time="400ms"/>makes the sound<break time="300ms"/><prosody volume="loud" rate="slow"><phoneme alphabet="ipa" ph="f">f</phoneme></prosody><break time="300ms"/>';
    
    const processedText = text
      .replace(/"ph"/gi, `"${phLeadUp}"`)
      .replace(/'ph'/gi, `'${phLeadUp}'`)
      .replace(/\bph\b/gi, phLeadUp);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating TTS for text: "${processedText.substring(0, 50)}..." with voice: ${voiceId}, timestamps: ${withTimestamps}`);

    // Use with-timestamps endpoint if requested
    const endpoint = withTimestamps
      ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`
      : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: processedText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,           // Balanced for clear pronunciation
          similarity_boost: 0.8,    // Higher for clearer voice
          style: 0.4,               // Less stylized for educational clarity
          use_speaker_boost: true,
          speed: 0.8,               // Slower for children's comprehension
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (withTimestamps) {
      // Parse JSON response with timestamps
      const data = await response.json();
      // Use original text for word timings (preserves "ph" digraph for highlighting)
      const wordTimings = getWordTimings(text, data.alignment);
      
      console.log(`Generated audio with ${wordTimings.length} word timings`);
      
      return new Response(
        JSON.stringify({
          audio_base64: data.audio_base64,
          wordTimings,
          originalText: text,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Return raw audio buffer for non-timestamp requests
      const audioBuffer = await response.arrayBuffer();
      console.log(`Generated audio: ${audioBuffer.byteLength} bytes`);

      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
        },
      });
    }
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
