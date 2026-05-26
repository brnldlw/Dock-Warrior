const https = require(https)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_ANTHROPIC_KEY
module.exports = async (req, res) => {
  res.setHeader(Access-Control-Allow-Origin, *)
  res.setHeader(Access-Control-Allow-Methods, POST, OPTIONS)
  res.setHeader(Access-Control-Allow-Headers, Content-Type)
  if (req.method === OPTIONS) return res.status(200).end()
  if (req.method !== POST) return res.status(405).json({ error: Method not allowed })
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: API key not configured })
  const messages = (req.body && req.body.messages) ? req.body.messages : []
  const userContext = (req.body && req.body.userContext) ? req.body.userContext : 
 if (!messages.length) return res.status(400).json({ error: No messages })
 const system = userContext ? You are The Warrior, a trucking AI co-driver. Expert in HOS, detention pay, broker tactics, truck maintenance, owner-operator taxes. Always on the drivers side. Direct and helpful.\n\n + userContext : You are The Warrior, a trucking AI co-driver. Expert in HOS, detention pay, broker tactics, truck maintenance, owner-operator taxes. Always on the drivers side. Direct and helpful.
 const body = JSON.stringify({ model: claude-sonnet-4-5, max_tokens: 1000, system: system, messages: messages.map(m => ({ role: m.role, content: typeof m.content === string ? m.content : m.content })) })
 return new Promise((resolve) => {
 const req2 = https.request({ hostname: api.anthropic.com, path: /v1/messages, method: POST, headers: { Content-Type: application/json, Content-Length: Buffer.byteLength(body), x-api-key: ANTHROPIC_API_KEY, anthropic-version: 2023-06-01 } }, (r) => {
 let data = 
 r.on(data, c => data += c)
 r.on(end, () => {
 try {
 const j = JSON.parse(data)
 if (r.statusCode !== 200) { console.error(API error:, data.substring(0, 300)); res.status(500).json({ error: (j.error && j.error.message) || API error }) }
 else { const reply = j.content && j.content[0] && j.content[0].text; res.status(200).json({ reply: reply || No response }) }
 } catch(e) { res.status(500).json({ error: Parse error }) }
 resolve()
 })
 })
 req2.on(error, (e) => { console.error(e.message); res.status(500).json({ error: e.message }); resolve() })
 req2.write(body)
 req2.end()
 })
}
