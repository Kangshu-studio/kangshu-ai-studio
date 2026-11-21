import { generateStoryboard } from '../../server/geminiService.ts';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body permintaan JSON tidak valid.' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const result = await generateStoryboard(payload);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: JSON_HEADERS,
  });
};
