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

// Convert character-level alignment to word-level timing
function getWordTimings(text: string, alignment: AlignmentData): WordTiming[] {
  const words: WordTiming[] = [];
  const characters = alignment.characters;
  const startTimes = alignment.character_start_times_seconds;
  const endTimes = alignment.character_end_times_seconds;
  
  let currentWord = '';
  let wordStartTime = 0;
  let wordEndTime = 0;
  let inWord = false;
  
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const isWordChar = /[a-zA-Z0-9''-]/.test(char);
    
    if (isWordChar) {
      if (!inWord) {
        // Start of new word
        inWord = true;
        wordStartTime = startTimes[i];
        currentWord = char;
      } else {
        // Continue current word
        currentWord += char;
      }
      wordEndTime = endTimes[i];
    } else {
      if (inWord && currentWord.trim()) {
        // End of word - save it
        words.push({
          word: currentWord,
          startTime: wordStartTime,
          endTime: wordEndTime,
        });
        currentWord = '';
        inWord = false;
      }
    }
  }
  
  // Don't forget the last word if text doesn't end with punctuation
  if (inWord && currentWord.trim()) {
    words.push({
      word: currentWord,
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

    // Preprocess text for children's book digraph pronunciation
    // Replace isolated "ph" or "Ph" with "f" sound (not "p-h")
    const processedText = text
      .replace(/\bph\b/gi, 'f')           // isolated "ph" → "f"
      .replace(/\bPh\b/g, 'F')            // preserve capitalization
      .replace(/\"ph\"/gi, '"f"')         // quoted "ph" → "f"
      .replace(/\'ph\'/gi, "'f'");        // single-quoted 'ph' → 'f'

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
          stability: 0.4,           // More expressive for storytelling
          similarity_boost: 0.75,
          style: 0.6,               // More stylized for engaging delivery
          use_speaker_boost: true,
          speed: 0.9,               // Slightly slower for children's comprehension
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
      const wordTimings = getWordTimings(processedText, data.alignment);
      
      console.log(`Generated audio with ${wordTimings.length} word timings`);
      
      return new Response(
        JSON.stringify({
          audio_base64: data.audio_base64,
          wordTimings,
          originalText: text,
          processedText,
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
