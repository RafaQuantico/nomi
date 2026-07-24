export const config = { runtime: 'edge' };

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzuckGDrAO4FXJvhTS08XbYDQyGmiVS-masTb7Ov3lHu8sDZpOV8_vpudET0b7NXkZe/exec';

export default async function handler(req: Request) {
  // CORS headers – allow the browser to call this endpoint
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let gsResponse;

    if (req.method === 'GET') {
      // Forward GET request with URL parameters
      const url = new URL(req.url);
      const targetUrl = `${APPS_SCRIPT_URL}${url.search}`;
      
      gsResponse = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
      });
    } else {
      // Forward POST request
      const body = await req.text();
      gsResponse = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body,
        redirect: 'follow',
      });
    }

    const text = await gsResponse.text();

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
