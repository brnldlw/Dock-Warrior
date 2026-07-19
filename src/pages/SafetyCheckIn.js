import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { Shield, Clock, CheckCircle, AlertTriangle, Bell, User, Zap, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useIsNativeApp, showNativePaywall } from '../hooks/useIsNativeApp'
import toast from 'react-hot-toast'
import './SafetyCheckIn.css'

const STORAGE_KEY = 'dw_safety_timer'

function formatCountdown(seconds) {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function loadTimerState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    return JSON.parse(saved)
  } catch { return null }
}

function saveTimerState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function clearTimerState() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function SafetyCheckIn() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const isNative = useIsNativeApp()
  const [contactName, setContactName] = useState(() => localStorage.getItem('dw_contact_name') || '')
  const [contactPhone, setContactPhone] = useState(() => localStorage.getItem('dw_contact_phone') || '')
  const [timerMinutes, setTimerMinutes] = useState(60)
  const [facilityName, setFacilityName] = useState('')
  const [active, setActive] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [expired, setExpired] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [smsSent, setSmsSent] = useState(false)
  const intervalRef = useRef(null)

  // On mount, restore any active timer from localStorage
  useEffect(() => {
    const saved = loadTimerState()
    if (saved && saved.active) {
      const endTime = new Date(saved.endTime)
      const now = new Date()
      const secondsLeft = Math.floor((endTime - now) / 1000)

      if (secondsLeft > 0) {
        // Timer still running
        setFacilityName(saved.facilityName || '')
        setTimerMinutes(saved.timerMinutes || 60)
        setStartedAt(new Date(saved.startedAt))
        setActive(true)
        setRemaining(secondsLeft)
        startInterval(endTime, saved)
      } else {
        // Timer expired while away
        setFacilityName(saved.facilityName || '')
        setExpired(true)
        setActive(false)
        clearTimerState()
        toast.error('⚠ Your safety timer expired while you were away!', { duration: 10000 })
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [])

  const startInterval = (endTime, savedState) => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const now = new Date()
      const secondsLeft = Math.floor((endTime - now) / 1000)
      if (secondsLeft <= 0) {
        clearInterval(intervalRef.current)
        setExpired(true)
        setActive(false)
        clearTimerState()
        if (isPro && savedState?.contactPhone) {
          sendSmsAlert(savedState)
        }
        toast.error('⚠ Check-in timer expired!', { duration: 10000 })
        setRemaining(0)
      } else {
        setRemaining(secondsLeft)
      }
    }, 1000)
  }

  const saveContact = () => {
    localStorage.setItem('dw_contact_name', contactName)
    localStorage.setItem('dw_contact_phone', contactPhone)
    toast.success('Emergency contact saved')
  }

  const sendSmsAlert = async (state) => {
    try {
      const response = await fetch('/api/send-safety-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactPhone: state?.contactPhone || contactPhone,
          contactName: state?.contactName || contactName,
          driverName: user?.user_metadata?.full_name || 'Your driver',
          facilityName: state?.facilityName || facilityName,
          arrivedAt: state?.startedAt || startedAt?.toISOString(),
          timerMinutes: state?.timerMinutes || timerMinutes
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

    const now = new Date()
    const endTime = new Date(now.getTime() + timerMinutes * 60 * 1000)

    const state = {
      active: true,
      facilityName,
      timerMinutes,
      startedAt: now.toISOString(),
      endTime: endTime.toISOString(),
      contactName,
      contactPhone
    }

    saveTimerState(state)
    setStartedAt(now)
    setActive(true)
    setCheckedIn(false)
    setExpired(false)
    setSmsSent(false)
    setRemaining(timerMinutes * 60)
    startInterval(endTime, state)
    toast.success(`Safety timer started — ${timerMinutes} minutes`)
  }

  const handleCheckIn = () => {
    clearInterval(intervalRef.current)
    clearTimerState()
    setActive(false)
    setCheckedIn(true)
    setExpired(false)
    toast.success('✓ Checked in safely!')
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    clearTimerState()
    setActive(false)
    setCheckedIn(false)
    setExpired(false)
    setRemaining(0)
    setFacilityName('')
    setSmsSent(false)
  }

  const percentLeft = active && timerMinutes > 0 ? (remaining / (timerMinutes * 60)) * 100 : 0
  const isWarning = percentLeft < 25 && active

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Shield size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Safety Check-In</h2>
        <p>Set a timer when you arrive. If you don't check back in, your emergency contact gets an alert.</p>
      </div>

      {!isPro && (
        <div className="safety-pro-banner">
          <Zap size={18} />
          <div><strong>Pro Feature — SMS Alerts</strong> — Free users get the timer. Pro members get automatic SMS to their emergency contact when the timer expires.</div>
          {isNative
                ? <button style={{background:'none',border:'none',color:'var(--orange)',cursor:'pointer',fontSize:14,fontWeight:600}} onClick={showNativePaywall}>⚔ Upgrade to Pro</button>
                : <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade to Pro</Link>}
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
                <label className="form-label">Phone Number {isPro && <span style={{ color: 'var(--orange)', fontSize: 11 }}>SMS ENABLED</span>}</label>
                <input className="form-input" type="tel" placeholder="e.g. 317-555-0100" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={saveContact}>
              <CheckCircle size={14} /> Save Contact
            </button>
          </div>

          {/* TIMER SETUP */}
          {!active && !checkedIn && !expired && (
            <div className="card">
              <h3 className="checkin-section-title"><Clock size={18} /> Check-In Timer</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Facility Name</label>
                  <input className="form-input" placeholder="Where are you?" value={facilityName} onChange={e => setFacilityName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Check-In Window</label>
                  <select className="form-input" value={timerMinutes} onChange={e => setTimerMinutes(parseInt(e.target.value))}>
                    <option value={1}>1 minute (test)</option>
                    <option value={15}>15 minutes</option>
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
          )}

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
                  {isPro ? `${contactName} will receive SMS if timer expires` : `${contactName} listed as emergency contact`}
                </div>
                <div className="timer-controls-row">
                  <button className="btn btn-primary btn-lg checkin-btn" onClick={handleCheckIn}>
                    <CheckCircle size={20} /> I'm Safe — Check In
                  </button>
                  <button className="btn btn-secondary" onClick={handleReset} title="Reset timer">
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
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
                  ? <p style={{ color: 'var(--green)' }}>✓ SMS alert sent to {contactName}</p>
                  : <p>{isPro ? `Attempting to alert ${contactName}...` : `Upgrade to Pro for automatic SMS alerts.`}</p>
                }
                <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: 16 }}>
                  <RotateCcw size={16} /> Start New Timer
                </button>
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
              <li>Set your check-in window</li>
              <li>Start the timer — it keeps running even if you leave this page</li>
              <li>Tap "I'm Safe" when you leave</li>
              <li>{isPro ? 'If timer expires, your contact gets an SMS automatically' : 'Upgrade to Pro for automatic SMS alerts'}</li>
            </ol>
          </div>

          <div className="card checkin-info-card">
            <h4><AlertTriangle size={16} /> Who This Is For</h4>
            <p>Solo drivers — especially women in trucking — at unfamiliar facilities, remote locations, or late-night stops. One tap gives someone you trust a lifeline.</p>
          </div>

          {isPro && (
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Barlow Condensed', fontSize: 15, fontWeight: 800, textTransform: 'uppercase', color: 'var(--green)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={15} /> SMS Active
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Your emergency contact will automatically receive a text if your timer expires without checking in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}