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
    const { leagueId, season } = await req.json();

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default to Premier League 2024
    const league = leagueId || 39;
    const seasonYear = season || 2024;

    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/teams?league=${league}&season=${seasonYear}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        },
      }
    );

    const data = await response.json();
    
    const teams = data.response?.map((item: any) => ({
      id: item.team.id.toString(),
      name: item.team.name,
      logo: item.team.logo,
      country: item.team.country,
    })) || [];

    return new Response(
      JSON.stringify({ teams }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch teams' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
