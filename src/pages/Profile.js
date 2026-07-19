import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useIsNativeApp, showNativePaywall } from '../hooks/useIsNativeApp'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { User, Star, Clock, Shield, DollarSign, Zap, Crown, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import './Profile.css'

const BADGES = [
  { id: 'warrior', icon: '🛡️', label: 'DockWarrior', desc: 'Joined the community', condition: () => true },
  { id: 'first_review', icon: '⭐', label: 'First Review', desc: 'Submitted your first review', condition: (reviews) => reviews.length >= 1 },
  { id: 'road_veteran', icon: '🚛', label: 'Road Veteran', desc: '10+ reviews submitted', condition: (reviews) => reviews.length >= 10 },
  { id: 'fifty_reviews', icon: '🔥', label: 'On Fire', desc: '50+ reviews submitted', condition: (reviews) => reviews.length >= 50 },
  { id: 'detention_fighter', icon: '⚖️', label: 'Detention Fighter', desc: 'Logged your first detention', condition: (reviews, logs) => logs.length >= 1 },
  { id: 'time_is_money', icon: '💰', label: 'Time Is Money', desc: '10+ detention logs', condition: (reviews, logs) => logs.length >= 10 },
]

function formatMoney(minutes) {
  const hours = minutes / 60
  const low = Math.round(hours * 25)
  const high = Math.round(hours * 75)
  return `$${low}–$${high}`
}

// Detect if running inside native DockWarrior app
const isNativeApp = () => navigator.userAgent.includes('DockWarriorApp')

export default function Profile() {
  const { user, signOut } = useAuth()
  const { isPro, subscription } = useSubscription()
  const navigate = useNavigate()
  const isNative = useIsNativeApp()
  const [reviews, setReviews] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    const [reviewsRes, logsRes] = await Promise.all([
      supabase.from('reviews').select('*, facilities(name, city, state)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('detention_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])
    setReviews(reviewsRes.data || [])
    setLogs(logsRes.data || [])
    setLoading(false)
  }

  const handleGoProClick = () => {
    if (isNative) {
      showNativePaywall()
    } else {
      navigate('/pricing')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setDeleting(true)
    try {
      await supabase.from('reviews').delete().eq('user_id', user.id)
      await supabase.from('detention_logs').delete().eq('user_id', user.id)
      await supabase.from('subscriptions').delete().eq('user_id', user.id)
      await supabase.from('community_posts').delete().eq('user_id', user.id)
      await supabase.from('referrals').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('id', user.id)
      await signOut()
      toast.success('Account deleted successfully')
      navigate('/')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete account. Email contact@dockwarrior.com for help.')
    } finally {
      setDeleting(false)
    }
  }

  const totalDetentionMinutes = logs.reduce((s, l) => s + (l.detention_minutes || 0), 0)
  const earnedBadges = BADGES.filter(b => b.condition(reviews, logs))

  if (loading) return <div className="loading-spinner"><div className="spinner" />Loading profile...</div>

  return (
    <div className="page">
      {/* PROFILE HEADER */}
      <div className="profile-header card">
        <div className="profile-avatar">
          <User size={32} />
        </div>
        <div className="profile-info">
          <h1 className="profile-name">
            {user?.user_metadata?.full_name || 'Warrior'}
            {isPro && <span className="pro-crown"><Crown size={20} /> PRO</span>}
          </h1>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-badges-row">
            {isPro && (
              <span className="badge badge-orange">
                <Crown size={12} /> Pro Member
              </span>
            )}
            {earnedBadges.map(b => (
              <span key={b.id} className="badge badge-orange" title={b.desc}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>
        <div className="profile-actions">
          {!isPro && (
            <button className="btn btn-primary btn-sm" onClick={handleGoProClick}>
              <Zap size={14} /> Go Pro
            </button>
          )}
          {isPro && (
            <div className="pro-status-badge">
              <Crown size={14} /> Pro Active
            </div>
          )}
          <button className="btn btn-secondary btn-sm" onClick={async () => { await signOut(); navigate('/') }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* PRO UPSELL if not pro */}
      {!isPro && (
        <div className="pro-upsell-bar">
          <Zap size={18} />
          <div>
            <strong>Upgrade to Pro for $14/month</strong> — Unlimited AI, PDF detention invoices, route alerts, safety SMS and more.
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleGoProClick}>Upgrade Now</button>
        </div>
      )}

      {/* STATS GRID */}
      <div className="profile-stats">
        <div className="card profile-stat-card">
          <Star size={24} className="pstat-icon" />
          <div className="pstat-value">{reviews.length}</div>
          <div className="pstat-label">Reviews Submitted</div>
        </div>
        <div className="card profile-stat-card">
          <Clock size={24} className="pstat-icon" />
          <div className="pstat-value">{logs.length}</div>
          <div className="pstat-label">Detention Logs</div>
        </div>
        <div className="card profile-stat-card">
          <Clock size={24} className="pstat-icon" style={{ color: 'var(--red)' }} />
          <div className="pstat-value" style={{ color: 'var(--red)' }}>
            {totalDetentionMinutes > 0 ? `${Math.round(totalDetentionMinutes / 60)}h` : '0h'}
          </div>
          <div className="pstat-label">Total Detention Time</div>
        </div>
        <div className="card profile-stat-card">
          <DollarSign size={24} className="pstat-icon" style={{ color: 'var(--green)' }} />
          <div className="pstat-value" style={{ color: 'var(--green)', fontSize: totalDetentionMinutes > 0 ? '24px' : '40px' }}>
            {totalDetentionMinutes > 0 ? formatMoney(totalDetentionMinutes) : '$0'}
          </div>
          <div className="pstat-label">Est. Detention Value Lost</div>
        </div>
      </div>

      {/* BADGES */}
      <div className="section-header" style={{ marginTop: 40 }}>
        <div className="accent-line" />
        <h2>Your Badges</h2>
      </div>
      <div className="badges-grid">
        {BADGES.map(b => {
          const earned = b.condition(reviews, logs)
          return (
            <div key={b.id} className={`badge-card card ${earned ? 'badge-earned' : 'badge-locked'}`}>
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-label">{b.label}</div>
              <div className="badge-desc">{b.desc}</div>
              {!earned && <div className="badge-locked-label">Locked</div>}
            </div>
          )
        })}
      </div>

      {/* RECENT REVIEWS */}
      <div className="section-header" style={{ marginTop: 40 }}>
        <div className="accent-line" />
        <h2>Your Reviews</h2>
      </div>
      {reviews.length === 0 ? (
        <div className="empty-state">
          <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No reviews yet</h3>
          <p>Search a facility and leave your first review.</p>
          <Link to="/search" className="btn btn-primary" style={{ marginTop: 16 }}>Search Docks</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => (
            <Link key={r.id} to={`/facility/${r.facility_id}`} className="card profile-review card-clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="profile-review-top">
                <div>
                  <div className="profile-review-facility">{r.facilities?.name || 'Unknown Facility'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.facilities?.city}, {r.facilities?.state}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stars" style={{ justifyContent: 'flex-end' }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ fontSize: 14 }} className={`star ${n <= r.overall_rating ? 'filled' : ''}`}>★</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {r.notes && <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{r.notes}"</p>}
            </Link>
          ))}
        </div>
      )}

      {/* DETENTION LOGS */}
      <div className="section-header" style={{ marginTop: 40 }}>
        <div className="accent-line" />
        <h2>Detention Log History</h2>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">
          <Clock size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No detention logs yet</h3>
          <p>Use the timer at your next stop.</p>
          <Link to="/timer" className="btn btn-primary" style={{ marginTop: 16 }}>Open Timer</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map(log => (
            <div key={log.id} className="card log-row">
              <div className="log-row-top">
                <div>
                  <div className="log-facility-name">{log.facility_name}</div>
                  <div className="log-meta">{new Date(log.arrived_at).toLocaleDateString()} · {log.broker_name || 'No broker recorded'}</div>
                </div>
                <div>
                  {log.detention_minutes > 0 ? (
                    <span className="badge badge-red">
                      {Math.floor(log.detention_minutes / 60) > 0 ? `${Math.floor(log.detention_minutes / 60)}h ` : ''}{log.detention_minutes % 60}m detention
                    </span>
                  ) : (
                    <span className="badge badge-green">No detention</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELETE ACCOUNT */}
      <div className="section-header" style={{ marginTop: 40 }}>
        <div className="accent-line" />
        <h2>Account Settings</h2>
      </div>
      <div className="card" style={{ padding: 24, marginBottom: 40 }}>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, textTransform: 'uppercase', color: '#ef4444', marginBottom: 8 }}>
          Delete Account
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={14} /> Delete My Account
        </button>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid #ef4444', borderRadius: 12, padding: 32, maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <AlertTriangle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', color: '#ef4444' }}>
                Delete Account
              </h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete your account and all data including reviews, detention logs, and subscription history. This cannot be undone.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Type <strong style={{ color: '#ef4444' }}>DELETE</strong> to confirm:
            </p>
            <input
              className="form-input"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              style={{ marginBottom: 16 }}
              autoCapitalize="none"
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleDeleteAccount}
                disabled={deleting || deleteInput !== 'DELETE'}
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}