import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { Shield, Phone, Clock, CheckCircle, AlertTriangle, Bell, User, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import './SafetyCheckIn.css'

function formatCountdown(seconds) {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SafetyCheckIn() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const [contactName, setContactName] = useState(() => localStorage.getItem('dw_contact_name') || '')
  const [contactPhone, setContactPhone] = useState(() => localStorage.getItem('dw_contact_phone') || '')
  const [timerMinutes, setTimerMinutes] = useState(60)
  const [facilityName, setFacilityName] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [expired, setExpired] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [smsSent, setSmsSent] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  const saveContact = () => {
    localStorage.setItem('dw_contact_name', contactName)
    localStorage.setItem('dw_contact_phone', contactPhone)
    toast.success('Emergency contact saved')
  }

  const sendSmsAlert = async () => {
    if (!isPro || !contactPhone) return
    try {
      const response = await fetch('/api/send-safety-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactPhone,
          contactName,
          driverName: user?.user_metadata?.full_name || 'Your driver',
          facilityName,
          arrivedAt: startedAt?.toISOString(),
          timerMinutes
        })
      })
      if (response.ok) {
        setSmsSent(true)
        toast.success(`SMS alert sent to ${contactName}`)
      }
    } catch (err) {
      console.error('SMS error:', err)
    }
  }

  const handleStart = () => {
    if (!contactName.trim()) { toast.error('Add an emergency contact first'); return }
    if (!facilityName.trim()) { toast.error('Enter the facility name'); return }
    const totalSeconds = timerMinutes * 60
    const now = new Date()
    setRemaining(totalSeconds)
    setStartedAt(now)
    setActive(true)
    setCheckedIn(false)
    setExpired(false)
    setSmsSent(false)

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setExpired(true)
          setActive(false)
          sendSmsAlert()
          toast.error('⚠ Check-in timer expired!', { duration: 10000 })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    toast.success(`Safety timer started — ${timerMinutes} minutes`)
  }

  const handleCheckIn = () => {
    clearInterval(intervalRef.current)
    setActive(false)
    setCheckedIn(true)
    setExpired(false)
    toast.success('✓ Checked in safely!')
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setActive(false)
    setCheckedIn(false)
    setExpired(false)
    setRemaining(0)
    setFacilityName('')
    setNotes('')
    setSmsSent(false)
  }

  const percentLeft = active ? (remaining / (timerMinutes * 60)) * 100 : 0
  const isWarning = percentLeft < 25 && active

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Shield size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Safety Check-In</h2>
        <p>Set a timer when you arrive at an unfamiliar dock. If you don't check back in, your emergency contact gets a text alert.</p>
      </div>

      {!isPro && (
        <div className="safety-pro-banner">
          <Zap size={18} />
          <div>
            <strong>Pro Feature — SMS Alerts</strong> — Free users get the timer. Pro members get automatic SMS alerts sent to their emergency contact when the timer expires.
          </div>
          <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade to Pro</Link>
        </div>
      )}

      <div className="checkin-layout">
        <div className="checkin-main">

          {/* EMERGENCY CONTACT */}
          <div className="card checkin-contact">
            <h3 className="checkin-section-title"><User size={18} /> Emergency Contact</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-input" placeholder="e.g. Sarah Smith" value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Phone Number {isPro && <span style={{ color: 'var(--orange)', fontSize: 11 }}>SMS ALERTS ENABLED</span>}
                </label>
                <input className="form-input" type="tel" placeholder="e.g. 317-555-0100" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={saveContact}>
              <CheckCircle size={14} /> Save Contact
            </button>
          </div>

          {/* TIMER SETUP */}
          <div className="card">
            <h3 className="checkin-section-title"><Clock size={18} /> Check-In Timer</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Facility Name</label>
                <input className="form-input" placeholder="Where are you?" value={facilityName} onChange={e => setFacilityName(e.target.value)} disabled={active} />
              </div>
              <div className="form-group">
                <label className="form-label">Check-In Window</label>
                <select className="form-input" value={timerMinutes} onChange={e => setTimerMinutes(parseInt(e.target.value))} disabled={active}>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* TIMER DISPLAY */}
          <div className={`card checkin-timer ${isWarning ? 'timer-warning' : ''} ${expired ? 'timer-expired' : ''} ${checkedIn ? 'timer-safe' : ''}`}>
            {!active && !checkedIn && !expired && (
              <div className="timer-idle">
                <Shield size={64} className="idle-icon" />
                <p>Start the timer when you arrive at the dock.</p>
                <button className="btn btn-primary btn-lg" onClick={handleStart}>
                  <Shield size={20} /> Start Safety Timer
                </button>
              </div>
            )}

            {active && (
              <div className="timer-active">
                <div className="checkin-label">Check in before</div>
                <div className="checkin-countdown">{formatCountdown(remaining)}</div>
                <div className="checkin-facility">{facilityName}</div>
                <div className="checkin-progress-track">
                  <div className="checkin-progress-fill" style={{
                    width: `${percentLeft}%`,
                    background: percentLeft < 25 ? 'var(--red)' : percentLeft < 50 ? 'var(--yellow)' : 'var(--green)'
                  }} />
                </div>
                <div className="checkin-contact-alert">
                  <Bell size={14} />
                  {isPro
                    ? `${contactName} will receive an SMS if timer expires`
                    : `${contactName} listed as emergency contact`}
                </div>
                <button className="btn btn-primary btn-lg checkin-btn" onClick={handleCheckIn}>
                  <CheckCircle size={20} /> I'm Safe — Check In
                </button>
              </div>
            )}

            {checkedIn && (
              <div className="timer-result timer-result-safe">
                <CheckCircle size={64} />
                <h3>You're Checked In</h3>
                <p>Timer stopped. {contactName} was not alerted.</p>
                <button className="btn btn-secondary" onClick={handleReset}>Start New Timer</button>
              </div>
            )}

            {expired && (
              <div className="timer-result timer-result-expired">
                <AlertTriangle size={64} />
                <h3>Timer Expired</h3>
                {smsSent
                  ? <p style={{ color: 'var(--green)' }}>✓ SMS alert sent to {contactName} at {contactPhone}</p>
                  : <p>{isPro ? `Attempting to alert ${contactName}...` : `Upgrade to Pro to enable automatic SMS alerts to ${contactName}.`}</p>
                }
                <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: 16 }}>Reset</button>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="checkin-sidebar">
          <div className="card">
            <h4 className="sidebar-info-title"><Shield size={16} /> How It Works</h4>
            <ol className="how-list">
              <li>Save your emergency contact</li>
              <li>Enter the facility name</li>
              <li>Set how long you expect to be there</li>
              <li>Start the timer when you arrive</li>
              <li>Tap "I'm Safe" when you leave</li>
              <li>{isPro ? 'If you don\'t check in, your contact gets an SMS automatically' : 'Upgrade to Pro for automatic SMS alerts'}</li>
            </ol>
          </div>

          <div className="card checkin-info-card">
            <h4><AlertTriangle size={16} /> Who This Is For</h4>
            <p>Solo drivers — especially women in trucking — who pull into unfamiliar facilities, remote locations, or late-night stops. One tap gives someone you trust a lifeline to reach you.</p>
          </div>

          {isPro && (
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: 800, textTransform: 'uppercase', color: 'var(--green)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={15} /> SMS Active
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                As a Pro member, your emergency contact will automatically receive a text message if your timer expires without checking in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
