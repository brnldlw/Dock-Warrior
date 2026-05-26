const https = require('https')
const KEY = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_ANTHROPIC_KEY

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!KEY) return res.status(500).json({ error: 'API key not configured' })

  const messages = (req.body && req.body.messages) ? req.body.messages : []
  const userContext = (req.body && req.body.userContext) ? req.body.userContext : ''
  if (!messages.length) return res.status(400).json({ error: 'No messages' })

  const system = 'You are The Warrior, a trucking AI co-driver. Expert in HOS rules, detention pay, broker tactics, truck maintenance, owner-operator taxes. Always on the drivers side. Direct and helpful.' + (userContext ? '\n\n' + userContext : '')

  const body = JSON.stringify({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    system: system,
    messages: messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : String(m.content) }))
  })

  return new Promise((resolve) => {
    const apiReq = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01'
      }
    }, (apiRes) => {
      let data = ''
      apiRes.on('data', chunk => { data += chunk })
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (apiRes.statusCode !== 200) {
            console.error('Anthropic error:', data.substring(0, 300))
            res.status(500).json({ error: (json.error && json.error.message) || 'API error' })
          } else {
            const reply = json.content && json.content[0] && json.content[0].text
            res.status(200).json({ reply: reply || 'No response' })
          }
        } catch (e) {
          res.status(500).json({ error: 'Parse error' })
        }
        resolve()
      })
    })
    apiReq.on('error', (e) => {
      res.status(500).json({ error: e.message })
      resolve()
    })
    apiReq.write(body)
    apiReq.end()
  })
}