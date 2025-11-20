import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoMetadataRequest {
  videoId: string;
}

interface TrackWatchTimeRequest {
  kidProfileId: string;
  videoContentId: string;
  secondsWatched: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Get YouTube API key
    const YOUTUBE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    switch (action) {
      case 'get-metadata': {
        const { videoId }: VideoMetadataRequest = await req.json();
        
        console.log('Fetching metadata for video:', videoId);
        
        // Fetch video details from YouTube Data API v3
        const youtubeResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
        );

        if (!youtubeResponse.ok) {
          const errorText = await youtubeResponse.text();
          console.error('YouTube API error:', errorText);
          throw new Error('Failed to fetch video metadata from YouTube');
        }

        const youtubeData = await youtubeResponse.json();
        
        if (!youtubeData.items || youtubeData.items.length === 0) {
          throw new Error('Video not found');
        }

        const videoData = youtubeData.items[0];
        
        // Parse duration from ISO 8601 format (e.g., PT1H2M10S)
        const duration = videoData.contentDetails.duration;
        const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = parseInt(durationMatch?.[1] || '0');
        const minutes = parseInt(durationMatch?.[2] || '0');
        const seconds = parseInt(durationMatch?.[3] || '0');
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              videoId,
              title: videoData.snippet.title,
              description: videoData.snippet.description,
              thumbnailUrl: videoData.snippet.thumbnails.high.url,
              durationSeconds: totalSeconds,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'track-watch-time': {
        const { kidProfileId, videoContentId, secondsWatched }: TrackWatchTimeRequest = await req.json();
        
        console.log('Tracking watch time:', { kidProfileId, videoContentId, secondsWatched });

        // Get or create today's watch session
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existingSession } = await supabaseClient
          .from('video_watch_sessions')
          .select('*')
          .eq('kid_profile_id', kidProfileId)
          .eq('video_content_id', videoContentId)
          .eq('watch_date', today)
          .single();

        if (existingSession) {
          // Update existing session
          const { error: updateError } = await supabaseClient
            .from('video_watch_sessions')
            .update({
              seconds_watched: existingSession.seconds_watched + secondsWatched,
              session_ended_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSession.id);

          if (updateError) throw updateError;
        } else {
          // Create new session
          const { error: insertError } = await supabaseClient
            .from('video_watch_sessions')
            .insert({
              kid_profile_id: kidProfileId,
              parent_user_id: user.id,
              video_content_id: videoContentId,
              watch_date: today,
              seconds_watched: secondsWatched,
              session_started_at: new Date().toISOString(),
              session_ended_at: new Date().toISOString(),
            });

          if (insertError) throw insertError;
        }

        // Get remaining time for today
        const { data: remainingSeconds, error: remainingError } = await supabaseClient
          .rpc('get_remaining_video_time', { p_kid_profile_id: kidProfileId });

        if (remainingError) throw remainingError;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              remainingSeconds: remainingSeconds || 0,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-remaining-time': {
        const kidProfileId = url.searchParams.get('kidProfileId');
        
        if (!kidProfileId) {
          throw new Error('Kid profile ID is required');
        }

        const { data: remainingSeconds, error } = await supabaseClient
          .rpc('get_remaining_video_time', { p_kid_profile_id: kidProfileId });

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              remainingSeconds: remainingSeconds || 0,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search-channels': {
        const searchQuery = url.searchParams.get('query');
        
        if (!searchQuery) {
          throw new Error('Search query is required');
        }

        console.log('Searching for channels:', searchQuery);
        
        // Search for channels using YouTube Data API v3
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=20&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error('YouTube API search error:', errorText);
          throw new Error('Failed to search channels');
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.items || searchData.items.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              data: { channels: [] },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get detailed channel info including subscriber count
        const channelIds = searchData.items.map((item: any) => item.snippet.channelId).join(',');
        const channelsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`
        );

        if (!channelsResponse.ok) {
          throw new Error('Failed to fetch channel details');
        }

        const channelsData = await channelsResponse.json();

        const channels = channelsData.items.map((channel: any) => ({
          channelId: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
          subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
          videoCount: parseInt(channel.statistics.videoCount || '0'),
        }));

        return new Response(
          JSON.stringify({
            success: true,
            data: { channels },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-channel-videos': {
        const channelId = url.searchParams.get('channelId');
        const maxResults = url.searchParams.get('maxResults') || '12';
        
        if (!channelId) {
          throw new Error('Channel ID is required');
        }

        console.log('Fetching videos for channel:', channelId);
        
        // Get videos from the channel
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error('YouTube API error:', errorText);
          throw new Error('Failed to fetch channel videos');
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.items || searchData.items.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              data: { videos: [] },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get video details including duration
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );

        if (!videosResponse.ok) {
          throw new Error('Failed to fetch video details');
        }

        const videosData = await videosResponse.json();

        const videos = videosData.items.map((video: any) => {
          const duration = video.contentDetails.duration;
          const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          const hours = parseInt(durationMatch?.[1] || '0');
          const minutes = parseInt(durationMatch?.[2] || '0');
          const seconds = parseInt(durationMatch?.[3] || '0');
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;

          return {
            videoId: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
            durationSeconds: totalSeconds,
            publishedAt: video.snippet.publishedAt,
          };
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: { videos },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
