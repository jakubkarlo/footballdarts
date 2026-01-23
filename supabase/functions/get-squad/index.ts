import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamId } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: 'Missing teamId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://api-football-v1.p.rapidapi.com/v3/players/squads?team=${teamId}`;
    console.log('Fetching squad from:', url);
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      },
    });

    const data = await response.json();
    console.log('API Response status:', response.status);
    console.log('API Response data:', JSON.stringify(data).substring(0, 500));
    
    if (!data.response || data.response.length === 0) {
      return new Response(
        JSON.stringify({ players: [], message: 'Team not found', debug: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const squad = data.response[0].players;
    const players = squad.map((p: any) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      position: p.position,
    }));

    return new Response(
      JSON.stringify({ players }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get squad' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
