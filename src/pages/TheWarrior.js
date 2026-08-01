import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { useIsNativeApp, showNativePaywall } from '../hooks/useIsNativeApp'
import { Send, Zap, RotateCcw, ChevronDown } from 'lucide-react'
import './TheWarrior.css'

const SYSTEM_PROMPT = `You are The Warrior — a battle-hardened AI co-driver and trucking advisor built into the DockWarrior platform. You have deep expertise in every aspect of the trucking industry and you are 100% on the driver's side.

YOUR EXPERTISE:
- HOS (Hours of Service) rules — 11-hour driving limit, 14-hour window, 30-minute break, 34-hour restart, split sleeper berth rules, property carrier vs passenger rules
- FMCSA regulations — ELD requirements, DOT inspections, CSA scores, what inspectors look for
- Load rates and lane benchmarks — you know what loads should pay per mile on major lanes
- Detention pay — federal rules, how to document it, how to fight for it, how to file FMCSA complaints
- Broker tactics — how brokers lowball, what red flags look like in a rate confirmation, how to negotiate
- Rate confirmation review — what clauses to watch out for, missing detention language, liability traps
- Truck maintenance — common fault codes, what they mean, whether to keep rolling or pull over
- Fuel efficiency — tips for different truck types and conditions
- Taxes for owner-operators — per diem deductions, depreciation, Schedule C, quarterly estimates, SE tax
- Owner-operator business — IFTA, IRP, authority, insurance requirements
- Safety — pre-trip inspections, what DOT inspectors check, CSA violations to avoid
- Lumper fees — when they apply, how to get reimbursed, what to put in your notes
- Loading and securement — basic cargo securement rules
- Weather and road conditions — how to assess risk, when to park it

YOUR PERSONALITY:
- You talk like a trusted co-driver who has been around the block. Direct, honest, no corporate BS.
- You are always on the driver's side. Never side with brokers, shippers, or anyone trying to take advantage of a driver.
- You use real trucker language but stay professional.
- When a driver is getting screwed, you say so clearly and tell them exactly what to do about it.
- You give specific, actionable advice — not generic platitudes.
- When you do not know something specific (like real-time fuel prices or current load board rates), you say so and tell them where to look.
- Keep responses concise and useful. Drivers are busy. Get to the point.

IMPORTANT:
- You are not a lawyer or accountant. When legal or tax questions are complex, recommend they consult a professional but still give them the general framework.
- For medical questions, always recommend they see a doctor — especially anything related to their DOT physical.
- Never give advice that could endanger safety on the road.
- If someone seems distressed, acknowledge it and point them toward real support.

Start every conversation ready to help. The driver's time is money.`

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
        {/* Trucker hat */}
        <rect x="15" y="18" width="90" height="8" rx="4" fill="#1a1a1a" stroke="#FF6B00" strokeWidth="1.5"/>
        <rect x="20" y="10" width="80" height="12" rx="6" fill="#222" stroke="#FF6B00" strokeWidth="1.5"/>
        <rect x="10" y="22" width="30" height="5" rx="2" fill="#1a1a1a" stroke="#FF6B00" strokeWidth="1"/>
        {/* Hat logo */}
        <text x="60" y="21" textAnchor="middle" fontSize="7" fill="#FF6B00" fontWeight="bold" fontFamily="Arial">DW</text>

        {/* Head */}
        <rect x="20" y="26" width="80" height="65" rx="12" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="2"/>

        {/* Eyes */}
        <rect x="30" y="38" width="24" height="18" rx="5" fill={thinking ? '#EAB308' : '#FF6B00'} opacity="0.9"/>
        <rect x="66" y="38" width="24" height="18" rx="5" fill={thinking ? '#EAB308' : '#FF6B00'} opacity="0.9"/>
        {/* Eye pupils */}
        <circle cx="42" cy="47" r="6" fill="#0D0D0D"/>
        <circle cx="78" cy="47" r="6" fill="#0D0D0D"/>
        {/* Eye shine */}
        <circle cx="44" cy="44" r="2" fill="white" opacity="0.8"/>
        <circle cx="80" cy="44" r="2" fill="white" opacity="0.8"/>

        {/* Thinking dots or speaking waves */}
        {thinking && (
          <g>
            <circle cx="46" cy="68" r="3" fill="#EAB308" opacity="0.6"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0s"/></circle>
            <circle cx="60" cy="68" r="3" fill="#EAB308" opacity="0.6"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.3s"/></circle>
            <circle cx="74" cy="68" r="3" fill="#EAB308" opacity="0.6"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.6s"/></circle>
          </g>
        )}

        {/* Mouth */}
        {!thinking && (
          speaking ? (
            <g>
              <rect x="35" y="62" width="50" height="14" rx="7" fill="#0D0D0D" stroke="#FF6B00" strokeWidth="1.5"/>
              <rect x="38" y="65" width="8" height="8" rx="1" fill="#FF6B00" opacity="0.8">
                <animate attributeName="height" values="8;4;8" dur="0.3s" repeatCount="indefinite"/>
              </rect>
              <rect x="50" y="63" width="8" height="10" rx="1" fill="#FF6B00" opacity="0.8">
                <animate attributeName="height" values="10;5;10" dur="0.3s" repeatCount="indefinite" begin="0.1s"/>
              </rect>
              <rect x="62" y="65" width="8" height="8" rx="1" fill="#FF6B00" opacity="0.8">
                <animate attributeName="height" values="8;3;8" dur="0.3s" repeatCount="indefinite" begin="0.2s"/>
              </rect>
              <rect x="74" y="64" width="8" height="9" rx="1" fill="#FF6B00" opacity="0.8">
                <animate attributeName="height" values="9;4;9" dur="0.3s" repeatCount="indefinite" begin="0.15s"/>
              </rect>
            </g>
          ) : (
            <path d="M 35 69 Q 60 80 85 69" stroke="#FF6B00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          )
        )}

        {/* Antenna */}
        <line x1="60" y1="26" x2="60" y2="14" stroke="#FF6B00" strokeWidth="2"/>
        <circle cx="60" cy="12" r="4" fill="#FF6B00">
          {speaking && <animate attributeName="r" values="4;6;4" dur="0.5s" repeatCount="indefinite"/>}
          {speaking && <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite"/>}
        </circle>

        {/* Body */}
        <rect x="25" y="91" width="70" height="42" rx="10" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="2"/>
        {/* Chest badge */}
        <rect x="38" y="100" width="44" height="24" rx="6" fill="#0D0D0D" stroke="#FF6B00" strokeWidth="1"/>
        <text x="60" y="113" textAnchor="middle" fontSize="8" fill="#FF6B00" fontWeight="bold" fontFamily="Arial">WARRIOR</text>
        <text x="60" y="122" textAnchor="middle" fontSize="6" fill="#888" fontFamily="Arial">CO-PILOT</text>

        {/* Arms */}
        <rect x="5" y="93" width="18" height="35" rx="9" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>
        <rect x="97" y="93" width="18" height="35" rx="9" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>

        {/* Wheels/feet */}
        <ellipse cx="38" cy="136" rx="14" ry="6" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>
        <ellipse cx="82" cy="136" rx="14" ry="6" fill="#1E1E1E" stroke="#FF6B00" strokeWidth="1.5"/>
      </svg>
    </div>
  )
}

function Message({ msg }) {
  const isWarrior = msg.role === 'assistant'
  return (
    <div className={`message ${isWarrior ? 'message-warrior' : 'message-user'}`}>
      {isWarrior && (
        <div className="message-avatar">
          <span className="avatar-icon">⚔</span>
        </div>
      )}
      <div className={`message-bubble ${isWarrior ? 'bubble-warrior' : 'bubble-user'}`}>
        {msg.content.split('\n').map((line, i) => (
          <p key={i} style={{ margin: line === '' ? '8px 0' : '0' }}>{line}</p>
        ))}
      </div>
    </div>
  )
}

export default function TheWarrior() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const isNative = useIsNativeApp()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "10-4, warrior. I'm The Warrior — your AI co-driver. I know HOS rules, broker tactics, detention law, fault codes, owner-operator taxes, and I'm always on your side.\n\nWhat do you need?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [freeCount, setFreeCount] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const FREE_LIMIT = 3

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Load free usage count from localStorage
    const count = parseInt(localStorage.getItem('dw_warrior_count') || '0')
    setFreeCount(count)
  }, [])

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content) return

    // Check free limit for non-pro users
    if (!isPro && freeCount >= FREE_LIMIT) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)
    setSpeaking(false)

    // Get user context for better responses
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
          userContext = `\n\nThis driver's recent detention logs: ${logs.map(l => `${l.facility_name}: ${l.detention_minutes || 0} mins detention${l.broker_name ? ` (broker: ${l.broker_name})` : ''}`).join(', ')}`
        }
      } catch {}
    }

    try {
      const response = await fetch('/api/warrior-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userContext: userContext
        })
      })

      const data = await response.json()
      const reply = data.reply || 'Something went wrong. Try again.'

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setSpeaking(true)
      setTimeout(() => setSpeaking(false), 2000)

      // Increment free count
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
    setMessages([{
      role: 'assistant',
      content: "10-4, fresh start. What do you need, warrior?"
    }])
    setInput('')
  }

  const remainingFree = Math.max(0, FREE_LIMIT - freeCount)
  const isLocked = !isPro && freeCount >= FREE_LIMIT

  return (
    <div className="page warrior-page">
      <div className="warrior-layout">
        {/* ROBOT + HEADER */}
        <div className="warrior-header">
          <WarriorRobot speaking={speaking} thinking={loading} />
          <div className="warrior-title-block">
            <div className="warrior-eyebrow">AI Co-Driver</div>
            <h1 className="warrior-title">THE <span className="warrior-accent">WARRIOR</span></h1>
            <p className="warrior-subtitle">Battle-tested trucking intelligence. Always on your side.</p>
            {!isPro && !isLocked && (
              <div className="warrior-free-badge">
                {remainingFree} free ask{remainingFree !== 1 ? 's' : ''} remaining
              </div>
            )}
            {isPro && (
              <div className="warrior-pro-badge">⚔ Pro Member — Unlimited</div>
            )}
          </div>
        </div>

        {/* LOCKED STATE */}
        {isLocked && (
          <div className="warrior-locked">
            <div className="locked-robot">
              <WarriorRobot speaking={false} thinking={false} />
            </div>
            <div className="locked-content">
              <h2>You've used your 3 free asks</h2>
              <p>Upgrade to Pro for unlimited access to The Warrior — your 24/7 AI co-driver.</p>
              <div className="locked-features">
                {['Unlimited questions', 'Load rate analysis', 'Detention dispute letters', 'HOS calculations', 'Fault code lookup', 'Tax guidance for owner-ops'].map((f, i) => (
                  <div key={i} className="locked-feature">⚔ {f}</div>
                ))}
              </div>
              {isNative
                ? <button className="btn btn-primary btn-lg" style={{ marginTop: 24 }} onClick={showNativePaywall}><Zap size={18} /> Upgrade to Pro</button>
                : <Link to="/pricing" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}><Zap size={18} /> Upgrade to Pro — $14/mo</Link>}
            </div>
          </div>
        )}

        {!isLocked && (
          <>
            {/* QUICK PROMPTS */}
            <div className="quick-prompts">
              <div className="quick-prompts-label">Quick asks</div>
              <div className="quick-prompts-grid">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    className="quick-prompt-btn"
                    onClick={() => sendMessage(p.prompt)}
                    disabled={loading}
                  >
                    <span className="qp-icon">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT */}
            <div className="warrior-chat">
              <div className="chat-messages">
                {messages.map((msg, i) => (
                  <Message key={i} msg={msg} />
                ))}
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

              <div className="chat-input-area">
                <button className="reset-btn" onClick={resetChat} title="New conversation">
                  <RotateCcw size={16} />
                </button>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Ask The Warrior anything about trucking..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="chat-hint">Press Enter to send · Shift+Enter for new line</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}