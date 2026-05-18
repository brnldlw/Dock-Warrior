import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Clock, Play, Square, FileText, MapPin, AlertTriangle, CheckCircle, RotateCcw, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import './DetentionTimer.css'

const TIMER_STORAGE_KEY = 'dw_detention_timer'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h > 0 ? h + 'h ' : ''}${m}m` : `${h}h`
}

export default function DetentionTimer() {
  const { user } = useAuth()
  const [mode, setMode] = useState('timer') // 'timer' or 'manual'
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [arrivedAt, setArrivedAt] = useState(null)
  const [departedAt, setDepartedAt] = useState(null)
  const [freeTimeMinutes, setFreeTimeMinutes] = useState(120)
  const [facilityName, setFacilityName] = useState('')
  const [facilityAddress, setFacilityAddress] = useState('')
  const [brokerName, setBrokerName] = useState('')
  const [loadNumber, setLoadNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [pastLogs, setPastLogs] = useState([])
  const intervalRef = useRef(null)

  // Manual entry mode
  const [manualArrival, setManualArrival] = useState('')
  const [manualDeparture, setManualDeparture] = useState('')
  const [manualFacility, setManualFacility] = useState('')
  const [manualBroker, setManualBroker] = useState('')
  const [manualLoad, setManualLoad] = useState('')
  const [manualFreeTime, setManualFreeTime] = useState(120)
  const [manualNotes, setManualNotes] = useState('')

  useEffect(() => {
    if (user) fetchPastLogs()

    // Restore active timer from localStorage
    const saved = localStorage.getItem(TIMER_STORAGE_KEY)
    if (saved) {
      try {
        const state = JSON.parse(saved)
        if (state.running && state.startTime) {
          const startTime = new Date(state.startTime)
          const elapsed = Math.floor((new Date() - startTime) / 1000)
          setElapsed(elapsed)
          setArrivedAt(startTime)
          setFacilityName(state.facilityName || '')
          setFacilityAddress(state.facilityAddress || '')
          setBrokerName(state.brokerName || '')
          setLoadNumber(state.loadNumber || '')
          setFreeTimeMinutes(state.freeTimeMinutes || 120)
          setRunning(true)
          startInterval(startTime)
        }
      } catch {}
    }

    return () => clearInterval(intervalRef.current)
  }, [user])

  const startInterval = (startTime) => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((new Date() - startTime) / 1000)
      setElapsed(elapsed)
    }, 1000)
  }

  const fetchPastLogs = async () => {
    const { data } = await supabase
      .from('detention_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setPastLogs(data || [])
  }

  const handleStart = () => {
    if (!facilityName.trim()) { toast.error('Enter the facility name first'); return }
    const now = new Date()
    setArrivedAt(now)
    setDepartedAt(null)
    setElapsed(0)
    setSaved(false)
    setRunning(true)

    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
      running: true,
      startTime: now.toISOString(),
      facilityName,
      facilityAddress,
      brokerName,
      loadNumber,
      freeTimeMinutes
    }))

    startInterval(now)
    toast.success('Timer started — clock is running')
  }

  const handleStop = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setDepartedAt(new Date())
    localStorage.removeItem(TIMER_STORAGE_KEY)
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    localStorage.removeItem(TIMER_STORAGE_KEY)
    setRunning(false)
    setElapsed(0)
    setArrivedAt(null)
    setDepartedAt(null)
    setSaved(false)
    setFacilityName('')
    setFacilityAddress('')
    setBrokerName('')
    setLoadNumber('')
    setNotes('')
  }

  const detentionSeconds = Math.max(0, elapsed - freeTimeMinutes * 60)
  const detentionMinutes = Math.floor(detentionSeconds / 60)
  const isInDetention = elapsed > freeTimeMinutes * 60
  const freeTimeRemaining = Math.max(0, freeTimeMinutes * 60 - elapsed)
  const freeTimePercent = Math.min(100, (elapsed / (freeTimeMinutes * 60)) * 100)

  const handleSaveLog = async () => {
    if (!user) { toast.error('Sign in to save logs'); return }
    if (!arrivedAt || !departedAt) { toast.error('Stop the timer first'); return }
    try {
      const { error } = await supabase.from('detention_logs').insert({
        user_id: user.id,
        facility_name: facilityName,
        facility_address: facilityAddress || null,
        arrived_at: arrivedAt.toISOString(),
        departed_at: departedAt.toISOString(),
        free_time_minutes: freeTimeMinutes,
        detention_minutes: detentionMinutes,
        notes: notes || null,
        broker_name: brokerName || null,
        load_number: loadNumber || null
      })
      if (error) throw error
      setSaved(true)
      toast.success('Log saved!')
      fetchPastLogs()
    } catch (err) {
      toast.error('Failed to save log')
    }
  }

  const handleManualSave = async () => {
    if (!manualFacility.trim()) { toast.error('Enter facility name'); return }
    if (!manualArrival) { toast.error('Enter arrival time'); return }
    if (!manualDeparture) { toast.error('Enter departure time'); return }

    const arrival = new Date(manualArrival)
    const departure = new Date(manualDeparture)
    const totalMinutes = Math.floor((departure - arrival) / 60000)
    const detMins = Math.max(0, totalMinutes - manualFreeTime)

    if (!user) { toast.error('Sign in to save logs'); return }

    try {
      const { error } = await supabase.from('detention_logs').insert({
        user_id: user.id,
        facility_name: manualFacility,
        arrived_at: arrival.toISOString(),
        departed_at: departure.toISOString(),
        free_time_minutes: manualFreeTime,
        detention_minutes: detMins,
        notes: manualNotes || null,
        broker_name: manualBroker || null,
        load_number: manualLoad || null
      })
      if (error) throw error
      toast.success('Log saved!')
      fetchPastLogs()
      generateManualReport(manualFacility, manualBroker, manualLoad, arrival, departure, manualFreeTime, detMins, manualNotes)
    } catch (err) {
      toast.error('Failed to save log')
    }
  }

  const generateReport = (fName, bName, lNum, arrTime, depTime, freeTime, detMins, reportNotes) => {
    const report = `DETENTION REPORT — DOCKWARRIOR
================================
Date: ${arrTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

FACILITY: ${(fName || '').toUpperCase()}
${bName ? 'Broker: ' + bName : ''}
${lNum ? 'Load #: ' + lNum : ''}

TIMELINE
--------
Arrived:   ${arrTime.toLocaleTimeString()}
Departed:  ${depTime ? depTime.toLocaleTimeString() : 'N/A'}
Free Time: ${freeTime} minutes
Total Time: ${formatDuration(Math.floor((depTime - arrTime) / 60000))}

DETENTION
---------
Detention Time: ${detMins > 0 ? formatDuration(detMins) : 'None — within free time'}
${detMins > 0 ? '⚠ DETENTION OCCURRED — ' + detMins + ' minutes beyond free time' : '✓ No detention'}

${reportNotes ? 'NOTES\n-----\n' + reportNotes : ''}

Generated by DockWarrior — dockwarrior.com
================================`.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detention-report-${(fName || 'stop').replace(/\s+/g, '-').toLowerCase()}-${arrTime.toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report downloaded!')
  }

  const generateManualReport = (fac, broker, load, arr, dep, freeTime, detMins, nts) => {
    generateReport(fac, broker, load, arr, dep, freeTime, detMins, nts)
  }

  const handleDownloadReport = () => {
    if (!arrivedAt) return
    generateReport(facilityName, brokerName, loadNumber, arrivedAt, departedAt || new Date(), freeTimeMinutes, detentionMinutes, notes)
  }

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2>Detention Timer</h2>
        <p>Track your time on site and build your paper trail.</p>
      </div>

      {/* MODE TOGGLE */}
      <div className="toggle-group" style={{ marginBottom: 24 }}>
        <button className={`toggle-pill ${mode === 'timer' ? 'active' : ''}`} onClick={() => setMode('timer')}>
          <Clock size={14} style={{ marginRight: 4 }} /> Live Timer
        </button>
        <button className={`toggle-pill ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
          <Edit3 size={14} style={{ marginRight: 4 }} /> Manual Entry
        </button>
      </div>

      {mode === 'manual' ? (
        /* MANUAL ENTRY MODE */
        <div className="timer-layout">
          <div className="timer-main">
            <div className="card timer-setup">
              <h3 className="setup-title">Enter Stop Details Manually</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Already at a stop or logging a past stop? Enter the times directly and generate your report instantly.
              </p>
              <div className="form-group">
                <label className="form-label">Facility Name *</label>
                <input className="form-input" placeholder="e.g. Amazon MDW2 Joliet" value={manualFacility} onChange={e => setManualFacility(e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Arrival Time *</label>
                  <input className="form-input" type="datetime-local" value={manualArrival} onChange={e => setManualArrival(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Departure Time *</label>
                  <input className="form-input" type="datetime-local" value={manualDeparture} onChange={e => setManualDeparture(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Broker Name</label>
                  <input className="form-input" placeholder="Broker company" value={manualBroker} onChange={e => setManualBroker(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Load Number</label>
                  <input className="form-input" placeholder="Reference #" value={manualLoad} onChange={e => setManualLoad(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Free Time (minutes)</label>
                  <select className="form-input" value={manualFreeTime} onChange={e => setManualFreeTime(parseInt(e.target.value))}>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min (standard)</option>
                    <option value={180}>180 min</option>
                    <option value={240}>240 min</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" placeholder="Optional notes" value={manualNotes} onChange={e => setManualNotes(e.target.value)} />
                </div>
              </div>

              {/* PREVIEW */}
              {manualArrival && manualDeparture && (
                <div className="manual-preview">
                  {(() => {
                    const arr = new Date(manualArrival)
                    const dep = new Date(manualDeparture)
                    const total = Math.floor((dep - arr) / 60000)
                    const det = Math.max(0, total - manualFreeTime)
                    return (
                      <>
                        <div className="manual-preview-stat">
                          <span>Total Time</span>
                          <strong>{formatDuration(total)}</strong>
                        </div>
                        <div className="manual-preview-stat">
                          <span>Detention</span>
                          <strong style={{ color: det > 0 ? 'var(--red)' : 'var(--green)' }}>
                            {det > 0 ? formatDuration(det) : 'None'}
                          </strong>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-primary btn-lg" onClick={handleManualSave} style={{ flex: 1, justifyContent: 'center' }}>
                  <FileText size={18} /> Save Log & Download Report
                </button>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="timer-sidebar">
            <div className="card">
              <h3 className="sidebar-title">Recent Logs</h3>
              {pastLogs.length === 0 ? (
                <p className="sidebar-empty">No logs yet.</p>
              ) : (
                <div className="logs-list">
                  {pastLogs.map(log => (
                    <div key={log.id} className="log-item">
                      <div className="log-facility">{log.facility_name}</div>
                      <div className="log-date">{new Date(log.arrived_at).toLocaleDateString()}</div>
                      <div className="log-stats">
                        {log.detention_minutes > 0 ? (
                          <span className="badge badge-red">{formatDuration(log.detention_minutes)} detention</span>
                        ) : (
                          <span className="badge badge-green">No detention</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* LIVE TIMER MODE */
        <div className="timer-layout">
          <div className="timer-main">
            <div className="card timer-setup">
              <h3 className="setup-title">Facility Info</h3>
              <div className="form-group">
                <label className="form-label">Facility Name *</label>
                <input className="form-input" placeholder="e.g. Amazon MDW2 Joliet" value={facilityName} onChange={e => setFacilityName(e.target.value)} disabled={running} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Address (optional)</label>
                  <input className="form-input" placeholder="Street address" value={facilityAddress} onChange={e => setFacilityAddress(e.target.value)} disabled={running} />
                </div>
                <div className="form-group">
                  <label className="form-label">Free Time (minutes)</label>
                  <select className="form-input" value={freeTimeMinutes} onChange={e => setFreeTimeMinutes(parseInt(e.target.value))} disabled={running}>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min (standard)</option>
                    <option value={180}>180 min</option>
                    <option value={240}>240 min</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Broker Name</label>
                  <input className="form-input" placeholder="Broker company" value={brokerName} onChange={e => setBrokerName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Load Number</label>
                  <input className="form-input" placeholder="Reference #" value={loadNumber} onChange={e => setLoadNumber(e.target.value)} />
                </div>
              </div>
            </div>

            {/* CLOCK */}
            <div className={`card timer-clock ${isInDetention ? 'in-detention' : ''}`}>
              <div className="progress-section">
                <div className="progress-label">
                  <span>Free Time</span>
                  <span>{isInDetention ? 'EXCEEDED' : `${Math.ceil(freeTimeRemaining / 60)} min remaining`}</span>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${freeTimePercent >= 100 ? 'exceeded' : freeTimePercent > 75 ? 'warning' : ''}`}
                    style={{ width: `${Math.min(freeTimePercent, 100)}%` }} />
                </div>
              </div>

              <div className="clock-display">
                <div className="clock-label">
                  {isInDetention ? (
                    <span className="detention-label"><AlertTriangle size={16} /> IN DETENTION</span>
                  ) : <span>Total Time on Site</span>}
                </div>
                <div className={`clock-time ${isInDetention ? 'detention-time' : ''}`}>
                  {formatTime(elapsed)}
                </div>
              </div>

              {isInDetention && (
                <div className="detention-counter">
                  <div className="detention-count-label">Detention Time</div>
                  <div className="detention-count-value">{formatTime(detentionSeconds)}</div>
                  <div className="detention-count-sub">{detentionMinutes} minutes billable</div>
                </div>
              )}

              {arrivedAt && (
                <div className="arrival-info">
                  <MapPin size={13} />
                  Arrived {arrivedAt.toLocaleTimeString()}
                  {departedAt && ` · Departed ${departedAt.toLocaleTimeString()}`}
                </div>
              )}

              <div className="timer-controls">
                {!running && elapsed === 0 && (
                  <button className="btn btn-primary btn-lg timer-btn" onClick={handleStart}>
                    <Play size={20} /> Start Timer
                  </button>
                )}
                {running && (
                  <button className="btn btn-danger btn-lg timer-btn" onClick={handleStop}>
                    <Square size={20} /> Stop Timer
                  </button>
                )}
                {(running || elapsed > 0) && (
                  <button className="btn btn-secondary timer-btn" onClick={handleReset} title="Reset">
                    <RotateCcw size={16} /> Reset
                  </button>
                )}
                {!running && elapsed > 0 && (
                  <>
                    {!saved && (
                      <button className="btn btn-primary timer-btn" onClick={handleSaveLog}>
                        Save Log
                      </button>
                    )}
                    {saved && <span className="saved-badge"><CheckCircle size={16} /> Saved</span>}
                    <button className="btn btn-secondary timer-btn" onClick={handleDownloadReport}>
                      <FileText size={16} /> Download Report
                    </button>
                  </>
                )}
              </div>
            </div>

            {(running || elapsed > 0) && (
              <div className="card">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" placeholder="Document everything..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="timer-sidebar">
            <div className="card">
              <h3 className="sidebar-title">Recent Logs</h3>
              {!user ? (
                <p className="sidebar-empty">Sign in to save detention logs.</p>
              ) : pastLogs.length === 0 ? (
                <p className="sidebar-empty">No logs yet.</p>
              ) : (
                <div className="logs-list">
                  {pastLogs.map(log => (
                    <div key={log.id} className="log-item">
                      <div className="log-facility">{log.facility_name}</div>
                      <div className="log-date">{new Date(log.arrived_at).toLocaleDateString()}</div>
                      <div className="log-stats">
                        <span className="stat-chip">
                          <Clock size={11} />
                          {formatDuration(Math.floor((new Date(log.departed_at) - new Date(log.arrived_at)) / 60000))}
                        </span>
                        {log.detention_minutes > 0 ? (
                          <span className="badge badge-red">{formatDuration(log.detention_minutes)} detention</span>
                        ) : (
                          <span className="badge badge-green">No detention</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card info-card">
              <h4><AlertTriangle size={16} /> Know Your Rights</h4>
              <ul>
                <li>Detention pay owed after 2 hours free time (FMCSA)</li>
                <li>Standard rate is $25–75/hour</li>
                <li>Document arrival and departure times</li>
                <li>Send detention request to broker in writing</li>
                <li>Use Manual Entry to log past stops</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
