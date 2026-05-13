// Vercel serverless function. Holds the Anthropic API key server-side
// and forwards prompts from the Cosmic Identity frontend.
//
// Required env var (set in Vercel project settings → Environment Variables):
//   ANTHROPIC_API_KEY = sk-ant-...

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server misconfigured',
      details: 'ANTHROPIC_API_KEY environment variable is not set.'
    });
  }

  // Vercel parses JSON bodies automatically when content-type is application/json.
  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const prompt = body.prompt;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "prompt" field.' });
  }
  if (prompt.length > 8000) {
    return res.status(400).json({ error: 'Prompt too long (8000 character limit).' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({
      error: 'Upstream request failed',
      details: err.message || String(err)
    });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
