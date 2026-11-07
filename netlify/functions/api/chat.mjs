const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 12000;
const allowedModes = new Set(['chat', 'study', 'math', 'science', 'translate', 'writing', 'coding', 'documents']);
const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, body: JSON.stringify(body) });

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const key = process.env.GROQ_API_KEY;
  if (!key) return json(503, { error: 'AI chat is not configured yet. Add GROQ_API_KEY in your Netlify environment variables, then redeploy.' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Request body must be valid JSON.' }); }
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) return json(400, { error: `Send between 1 and ${MAX_MESSAGES} messages.` });
  const messages = [];
  for (const item of body.messages) {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string' || !item.content.trim() || item.content.length > MAX_CONTENT_LENGTH) return json(400, { error: 'A message is invalid or too long (12,000 characters maximum).' });
    messages.push({ role: item.role, content: item.content });
  }
  const mode = typeof body.mode === 'string' && allowedModes.has(body.mode) ? body.mode : 'chat';
  const system = typeof body.system === 'string' ? body.system.slice(0, 3000) : 'You are Friendly AI, a helpful and honest assistant.';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const upstream = await fetch(process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: system }, ...messages], temperature: 0.6, max_tokens: 1800 }),
    });
    if (!upstream.ok) {
      const detail = await upstream.json().catch(() => ({}));
      console.error('Groq API error', upstream.status, detail?.error?.message || 'Unknown provider error');
      return json(upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : 502, { error: upstream.status === 429 ? 'The AI provider is busy. Please wait a moment and try again.' : 'The AI provider could not complete this request. Check your server configuration and try again.' });
    }
    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) return json(502, { error: 'The AI provider returned an empty response.' });
    return json(200, { reply, usage: data.usage ? { totalTokens: data.usage.total_tokens } : undefined, mode });
  } catch (error) {
    console.error('Chat request failed:', error.name === 'AbortError' ? 'provider timeout' : error.message);
    return json(error.name === 'AbortError' ? 504 : 502, { error: error.name === 'AbortError' ? 'The AI request timed out. Please try again.' : 'Could not reach the AI provider. Please try again.' });
  } finally { clearTimeout(timeout); }
};
