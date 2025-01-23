import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RequestEvent {
  request: Request;
  headers: Headers;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for') || 
                    'unknown';
    
    // Get country from Cloudflare headers
    const country = req.headers.get('cf-ipcountry') || 'Unknown';

    console.log(`IP: ${clientIP}, Country: ${country}`); // Add logging

    return new Response(
      JSON.stringify({
        user_ip: clientIP,
        country: country
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in get-ip function:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});