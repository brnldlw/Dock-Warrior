import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Send, Zap, RotateCcw, Paperclip, X, FileText } from 'lucide-react'
import './TheWarrior.css'

const QUICK_PROMPTS = [
  { label: 'Review my rate con', prompt: 'I have a rate confirmation I want you to review. Here are the details:', icon: '📋' },
  { label: 'HOS question', prompt: 'I have a question about my hours of service:', icon: '⏱️' },
  { label: 'Fight detention denial', prompt: 'A broker is refusing to pay my detention. Here is what happened:', icon: '⚖️' },
  { label: 'Understand a fault code', prompt: 'My truck is showing fault code:', icon: '🔧' },
  { label: 'Negotiate a load rate', prompt: 'A broker offered me a load at [rate] for [miles] miles. Help me negotiate:', icon: '💰' },
  { label: 'Tax deduction question', prompt: 'I have a question about owner-operator tax deductions:', icon: '🧾' },
  { label: 'DOT inspection prep', prompt: 'I have a DOT inspection coming up. What should I check?', icon: '🚛' },
  { label: 'Is this load worth it?', prompt: 'Help me decide if this load is worth taking. Here are the details:', icon: '🧮' },
]

function WarriorRobot({ speaking, thinking }) {
  return (
    <div className={`warrior-robot ${speaking ? 'speaking' : ''} ${thinking ? 'thinking' : ''}`}>
      <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" className="robot-svg">
        <rect x="15" y="18" width="90" height="8" rx="4" fill="#1a1a1a" stroke="#FF6B00" strokeWidth="1.5"/>
        <rect x="20" y="10" width="80" height="12" rx="6" fill="#222" stroke="#FF6B00" strokeWidth="1.5"/>
        <rect x="10" y="22" width="30" height="5" rx="2" fill="#1a1a1a" stroke="#FF6B00" strokeWidth="1"/>
        <text x="60" y="21" textAnchor="middle" fontSize="7" fill="#FF6B00" fontWeight="bold" fontFamily="Arial">DW</text>
        <rect x="20" y="26" width="80" height="65" rx="12" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="2"/>
        <rect x="30" y="38" width="24" height="18" rx="5" fill={thinking ? '#EAB308' : '#FF6B00'} opacity="0.9"/>
        <rect x="66" y="38" width="24" height="18" rx="5" fill={thinking ? '#EAB308' : '#FF6B00'} opacity="0.9"/>
        <circle cx="42" cy="47" r="6" fill="#0D0D0D"/>
        <circle cx="78" cy="47" r="6" fill="#0D0D0D"/>
        <circle cx="44" cy="44" r="2" fill="white" opacity="0.8"/>
        <circle cx="80" cy="44" r="2" fill="white" opacity="0.8"/>
        {thinking && (
          <g>
            <circle cx="46" cy="68" r="3" fill="#EAB308" opacity="0.6"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0s"/></circle>
            <circle cx="60" cy="68" r="3" fill="#EAB308" opacity="0.6"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.3s"/></circle>
            <circle cx="74" cy="68" r="3" fill="#EAB308" opacity="0.6"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.6s"/></circle>
          </g>
        )}
        {!thinking && (
          speaking ? (
            <g>
              <rect x="35" y="62" width="50" height="14" rx="7" fill="#0D0D0D" stroke="#FF6B00" strokeWidth="1.5"/>
              <rect x="38" y="65" width="8" height="8" rx="1" fill="#FF6B00" opacity="0.8"><animate attributeName="height" values="8;4;8" dur="0.3s" repeatCount="indefinite"/></rect>
              <rect x="50" y="63" width="8" height="10" rx="1" fill="#FF6B00" opacity="0.8"><animate attributeName="height" values="10;5;10" dur="0.3s" repeatCount="indefinite" begin="0.1s"/></rect>
              <rect x="62" y="65" width="8" height="8" rx="1" fill="#FF6B00" opacity="0.8"><animate attributeName="height" values="8;3;8" dur="0.3s" repeatCount="indefinite" begin="0.2s"/></rect>
              <rect x="74" y="64" width="8" height="9" rx="1" fill="#FF6B00" opacity="0.8"><animate attributeName="height" values="9;4;9" dur="0.3s" repeatCount="indefinite" begin="0.15s"/></rect>
            </g>
          ) : (
            <path d="M 35 69 Q 60 80 85 69" stroke="#FF6B00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          )
        )}
        <line x1="60" y1="26" x2="60" y2="14" stroke="#FF6B00" strokeWidth="2"/>
        <circle cx="60" cy="12" r="4" fill="#FF6B00">
          {speaking && <animate attributeName="r" values="4;6;4" dur="0.5s" repeatCount="indefinite"/>}
        </circle>
        <rect x="25" y="91" width="70" height="42" rx="10" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="2"/>
        <rect x="38" y="100" width="44" height="24" rx="6" fill="#0D0D0D" stroke="#FF6B00" strokeWidth="1"/>
        <text x="60" y="113" textAnchor="middle" fontSize="8" fill="#FF6B00" fontWeight="bold" fontFamily="Arial">WARRIOR</text>
        <text x="60" y="122" textAnchor="middle" fontSize="6" fill="#888" fontFamily="Arial">CO-PILOT</text>
        <rect x="5" y="93" width="18" height="35" rx="9" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>
        <rect x="97" y="93" width="18" height="35" rx="9" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>
        <ellipse cx="38" cy="136" rx="14" ry="6" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>
        <ellipse cx="82" cy="136" rx="14" ry="6" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>
      </svg>
    </div>
  )
}

function MessageContent({ content }) {
  if (typeof content === 'string') {
    return content.split('\n').map((line, i) => (
      <p key={i} style={{ margin: line === '' ? '8px 0' : '0' }}>{line}</p>
    ))
  }
  if (Array.isArray(content)) {
    return content.map((part, i) => {
      if (part.type === 'text') {
        return part.text.split('\n').map((line, j) => (
          <p key={`${i}-${j}`} style={{ margin: line === '' ? '8px 0' : '0' }}>{line}</p>
        ))
      }
      if (part.type === 'image' && part.source) {
        return <img key={i} src={`data:${part.source.media_type};base64,${part.source.data}`} alt="attachment" style={{ maxWidth: '100%', borderRadius: 6, marginBottom: 8, display: 'block' }} />
      }
      if (part.type === 'document') {
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--orange)', fontSize: 13, marginBottom: 4 }}><FileText size={14} /> PDF attached</div>
      }
      return null
    })
  }
  return null
}

function Message({ msg }) {
  const isWarrior = msg.role === 'assistant'
  return (
    <div className={`message ${isWarrior ? 'message-warrior' : 'message-user'}`}>
      {isWarrior && <div className="message-avatar"><span className="avatar-icon">⚔</span></div>}
      <div className={`message-bubble ${isWarrior ? 'bubble-warrior' : 'bubble-user'}`}>
        <MessageContent content={msg.content} />
      </div>
    </div>
  )
}

export default function TheWarrior() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "10-4, warrior. I'm The Warrior — your AI co-driver. I know HOS rules, broker tactics, detention law, fault codes, owner-operator taxes, and I'm always on your side.\n\nGot a rate con, BOL, or any paperwork? Hit the 📎 button to upload it and I'll break it down for you.\n\nWhat do you need?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [freeCount, setFreeCount] = useState(0)
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const FREE_LIMIT = 3

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const count = parseInt(localStorage.getItem('dw_warrior_count') || '0')
    setFreeCount(count)
  }, [])

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newAttachments = []
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isPDF = file.type === 'application/pdf'
      if (!isImage && !isPDF) continue
      if (file.size > 5 * 1024 * 1024) continue
      const reader = new FileReader()
      await new Promise(resolve => {
        reader.onload = (ev) => {
          const base64 = ev.target.result.split(',')[1]
          newAttachments.push({
            name: file.name,
            type: file.type,
            base64,
            preview: isImage ? ev.target.result : null,
            mediaType: file.type
          })
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }
    setAttachments(prev => [...prev, ...newAttachments])
    setUploading(false)
    e.target.value = ''
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content && attachments.length === 0) return
    if (!isPro && freeCount >= FREE_LIMIT) return

    setInput('')

    let messageContent
    if (attachments.length > 0) {
      const parts = []
      for (const att of attachments) {
        if (att.type.startsWith('image/')) {
          parts.push({ type: 'image', source: { type: 'base64', media_type: att.mediaType, data: att.base64 } })
        } else if (att.type === 'application/pdf') {
          parts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: att.base64 } })
        }
      }
      if (content) parts.push({ type: 'text', text: content })
      messageContent = parts
    } else {
      messageContent = content
    }

    const newMessages = [...messages, { role: 'user', content: messageContent }]
    setMessages(newMessages)
    setAttachments([])
    setLoading(true)
    setSpeaking(false)

    let userContext = ''
    if (user) {
      try {
        const { data: logs } = await supabase
          .from('detention_logs')
          .select('facility_name, detention_minutes, broker_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (logs && logs.length > 0) {
          userContext = `This driver's recent detention logs: ${logs.map(l => `${l.facility_name}: ${l.detention_minutes || 0} mins detention${l.broker_name ? ` (broker: ${l.broker_name})` : ''}`).join(', ')}`
        }
      } catch {}
    }

    try {
      const response = await fetch('/api/warrior-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, userContext })
      })

      if (!response.ok) throw new Error('Server error ' + response.status)

      const data = await response.json()
      const reply = data.reply || 'Something went wrong. Try again.'

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setSpeaking(true)
      setTimeout(() => setSpeaking(false), 2000)

      if (!isPro) {
        const newCount = freeCount + 1
        setFreeCount(newCount)
        localStorage.setItem('dw_warrior_count', newCount.toString())
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lost signal for a second. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: '10-4, fresh start. What do you need, warrior?' }])
    setInput('')
    setAttachments([])
  }

  const remainingFree = Math.max(0, FREE_LIMIT - freeCount)
  const isLocked = !isPro && freeCount >= FREE_LIMIT

  return (
    <div className="page warrior-page">
      <div className="warrior-layout">
        <div className="warrior-header">
          <WarriorRobot speaking={speaking} thinking={loading} />
          <div className="warrior-title-block">
            <div className="warrior-eyebrow">AI Co-Driver</div>
            <h1 className="warrior-title">THE <span className="warrior-accent">WARRIOR</span></h1>
            <p className="warrior-subtitle">Battle-tested trucking intelligence. Always on your side.</p>
            {!isPro && !isLocked && (
              <div className="warrior-free-badge">{remainingFree} free ask{remainingFree !== 1 ? 's' : ''} remaining</div>
            )}
            {isPro && <div className="warrior-pro-badge">⚔ Pro Member — Unlimited</div>}
          </div>
        </div>

        {isLocked && (
          <div className="warrior-locked">
            <div className="locked-robot"><WarriorRobot speaking={false} thinking={false} /></div>
            <div className="locked-content">
              <h2>You have used your 3 free asks</h2>
              <p>Upgrade to Pro for unlimited access to The Warrior — your 24/7 AI co-driver.</p>
              <div className="locked-features">
                {['Unlimited questions', 'Rate con analysis', 'Document review', 'Detention dispute letters', 'HOS calculations', 'Fault code lookup', 'Tax guidance'].map((f, i) => (
                  <div key={i} className="locked-feature">⚔ {f}</div>
                ))}
              </div>
              <Link to="/pricing" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>
                <Zap size={18} /> Upgrade to Pro — $14/mo
              </Link>
            </div>
          </div>
        )}

        {!isLocked && (
          <>
            <div className="quick-prompts">
              <div className="quick-prompts-label">Quick asks</div>
              <div className="quick-prompts-grid">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} className="quick-prompt-btn" onClick={() => sendMessage(p.prompt)} disabled={loading}>
                    <span className="qp-icon">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="warrior-chat">
              <div className="chat-messages">
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {loading && (
                  <div className="message message-warrior">
                    <div className="message-avatar"><span className="avatar-icon">⚔</span></div>
                    <div className="message-bubble bubble-warrior bubble-thinking">
                      <span className="thinking-dot"></span>
                      <span className="thinking-dot"></span>
                      <span className="thinking-dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {attachments.length > 0 && (
                <div className="attachment-previews">
                  {attachments.map((att, i) => (
                    <div key={i} className="attachment-chip">
                      {att.preview
                        ? <img src={att.preview} alt={att.name} className="attachment-thumb" />
                        : <FileText size={14} style={{ color: 'var(--orange)' }} />
                      }
                      <span className="attachment-name">{att.name.length > 20 ? att.name.slice(0, 20) + '...' : att.name}</span>
                      <button className="attachment-remove" onClick={() => removeAttachment(i)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-input-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button className="reset-btn" onClick={resetChat} title="New conversation">
                  <RotateCcw size={16} />
                </button>
                <button
                  className="attach-btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={loading || uploading}
                  title="Attach image or PDF"
                >
                  {uploading
                    ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    : <Paperclip size={16} />
                  }
                </button>
                <textarea
                  className="chat-input"
                  placeholder="Ask The Warrior anything about trucking... or attach a document 📎"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || (!input.trim() && attachments.length === 0)}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="chat-hint">Press Enter to send · Shift+Enter for new line · 📎 to attach rate cons, BOLs, photos</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}