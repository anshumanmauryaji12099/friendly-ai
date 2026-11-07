const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, body: JSON.stringify(body) });
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const apiUrl = process.env.IMAGE_API_URL;
  const apiKey = process.env.IMAGE_API_KEY;
  if (!apiUrl || !apiKey) return json(503, { error: 'Image generation is not configured. Set IMAGE_API_URL and IMAGE_API_KEY as server environment variables.' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Request body must be valid JSON.' }); }
  if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 2000) return json(400, { error: 'Enter an image prompt of up to 2,000 characters.' });
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const upstream = await fetch(apiUrl, { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: body.prompt.trim() }) });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) { console.error('Image provider error:', upstream.status); return json(502, { error: 'The configured image provider did not complete this request.' }); }
    const imageUrl = result.imageUrl || result.image_url || result.url || result.data?.[0]?.url;
    if (typeof imageUrl !== 'string' || !/^https:\/\//i.test(imageUrl)) return json(502, { error: 'The image provider response did not contain a valid HTTPS image URL. Configure an adapter for your provider response format.' });
    return json(200, { imageUrl });
  } catch (error) {
    console.error('Image request failed:', error.name === 'AbortError' ? 'provider timeout' : error.message);
    return json(error.name === 'AbortError' ? 504 : 502, { error: 'Could not reach the configured image provider.' });
  } finally { clearTimeout(timeout); }
};
