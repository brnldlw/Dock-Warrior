import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Shield, Phone, Clock, CheckCircle, AlertTriangle, Bell, XCircle, User } from 'lucide-react'
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
  const [contactName, setContactName] = useState(() => localStorage.getItem('dw_contact_name') || '')
  const [contactPhone, setContactPhone] = useState(() => localStorage.getItem('dw_contact_phone') || '')
  const [contactEmail, setContactEmail] = useState(() => localStorage.getItem('dw_contact_email') || '')
  const [timerMinutes, setTimerMinutes] = useState(60)
  const [facilityName, setFacilityName] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [expired, setExpired] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  const saveContact = () => {
    localStorage.setItem('dw_contact_name', contactName)
    localStorage.setItem('dw_contact_phone', contactPhone)
    localStorage.setItem('dw_contact_email', contactEmail)
    toast.success('Emergency contact saved')
  }

  const handleStart = () => {
    if (!contactName.trim()) { toast.error('Add an emergency contact first'); return }
    if (!facilityName.trim()) { toast.error('Enter the facility name'); return }
    const totalSeconds = timerMinutes * 60
    setRemaining(totalSeconds)
    setStartedAt(new Date())
    setActive(true)
    setCheckedIn(false)
    setExpired(false)

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setExpired(true)
          setActive(false)
          toast.error('⚠ Check-in timer expired! Your contact should be notified.', { duration: 10000 })
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
    toast.success('✓ Checked in safely. Timer stopped.')
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setActive(false)
    setCheckedIn(false)
    setExpired(false)
    setRemaining(0)
    setFacilityName('')
    setNotes('')
  }

  const percentLeft = active ? (remaining / (timerMinutes * 60)) * 100 : 0
  const isWarning = percentLeft < 25 && active

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Shield size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Safety Check-In</h2>
        <p>Set a timer when you arrive at an unfamiliar dock. If you don't check back in, your emergency contact gets alerted.</p>
      </div>

      <div className="checkin-layout">
        <div className="checkin-main">

          {/* EMERGENCY CONTACT */}
          <div className="card checkin-contact">
            <h3 className="checkin-section-title"><User size={18} /> Emergency Contact</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-input" placeholder="e.g. Sarah Ludlow" value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" placeholder="e.g. 317-555-0100" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input className="form-input" type="email" placeholder="their@email.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
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
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" placeholder="Truck number, load info, anything relevant..." value={notes} onChange={e => setNotes(e.target.value)} disabled={active} />
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
                  <div className="checkin-progress-fill" style={{ width: `${percentLeft}%`, background: percentLeft < 25 ? 'var(--red)' : percentLeft < 50 ? 'var(--yellow)' : 'var(--green)' }} />
                </div>
                <div className="checkin-contact-alert">
                  <Bell size={14} /> {contactName} will be alerted if timer expires
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
                <p>You did not check in. In a future Pro update, {contactName} would have been automatically notified at {contactPhone}.</p>
                <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="checkin-sidebar">
          <div className="card">
            <h4 className="sidebar-info-title"><Shield size={16} /> How It Works</h4>
            <ol className="how-list">
              <li>Save your emergency contact's info</li>
              <li>Enter the facility name when you arrive</li>
              <li>Set how long you expect to be there</li>
              <li>Start the timer</li>
              <li>Tap "I'm Safe" when you leave</li>
              <li>If you don't check in, your contact gets alerted</li>
            </ol>
          </div>

          <div className="card checkin-info-card">
            <h4><AlertTriangle size={16} /> Who This Is For</h4>
            <p>Solo drivers — especially women in trucking — who pull into unfamiliar facilities, remote locations, or late-night stops where something could go wrong and no one would know.</p>
            <p style={{ marginTop: 12 }}>This feature gives you a lifeline. One tap and someone knows where you are.</p>
          </div>

          <div className="card checkin-pro-card">
            <h4><Bell size={16} /> Coming in Pro</h4>
            <ul>
              <li>Automatic SMS alert to your contact when timer expires</li>
              <li>Your GPS location sent with the alert</li>
              <li>Multiple emergency contacts</li>
              <li>One-tap 911 shortcut</li>
            </ul>
            <a href="/pricing" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: 'inline-flex' }}>
              See Pro Features
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
