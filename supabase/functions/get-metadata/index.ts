import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ZENO_API_URL = 'https://api.zeno.fm/api/stations/mz5xfb9fffhvv/now_playing'
const DEEZER_API_URL = 'https://api.deezer.com/search'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function searchDeezerTrack(title: string, artist: string) {
  try {
    const query = `${artist} ${title}`.trim();
    const searchResponse = await fetch(
      `${DEEZER_API_URL}?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
      }
    );

    if (!searchResponse.ok) {
      console.error('Deezer API error:', await searchResponse.text());
      return null;
    }

    const searchData = await searchResponse.json();
    if (searchData.data && searchData.data.length > 0) {
      return searchData.data[0].album.cover_big || searchData.data[0].album.cover_medium || searchData.data[0].album.cover;
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Deezer:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log('Fetching metadata from Zeno FM API...');
    
    const response = await fetch(ZENO_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error(`Zeno FM API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received data from Zeno FM:', JSON.stringify(data));

    const title = data.now_playing?.song?.title || '';
    const artist = data.now_playing?.song?.artist || '';
    
    // Fetch cover art from Deezer
    const coverUrl = await searchDeezerTrack(title, artist);
    console.log('Cover URL from Deezer:', coverUrl);

    return new Response(
      JSON.stringify({ title, artist, coverUrl }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in get-metadata function:', error);
    
    return new Response(
      JSON.stringify({ 
        title: 'Loading...', 
        artist: 'Connecting to stream...',
        coverUrl: null,
        error: error.message
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200 // Return 200 even on error to prevent UI breaks
      }
    );
  }
})