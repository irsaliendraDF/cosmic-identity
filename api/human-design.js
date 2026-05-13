// Vercel serverless function. Proxies Human Design chart requests to
// humandesignhub.app so the API key stays server-side (and to sidestep CORS).
//
// Required env var:
//   HUMANDESIGN_API_KEY = your humandesignhub.app key (free tier = 200 req/mo)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.HUMANDESIGN_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server misconfigured',
      details: 'HUMANDESIGN_API_KEY environment variable is not set.'
    });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const { datetime } = body;

  if (!datetime || typeof datetime !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid "datetime" field. Expected ISO 8601 with timezone offset, e.g. 1990-01-15T10:00+00:00.'
    });
  }

  try {
    const upstream = await fetch('https://api.humandesignhub.app/v1/simple-bodygraph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({ datetime })
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
