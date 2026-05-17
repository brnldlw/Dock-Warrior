import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User, Star, Clock, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import './Profile.css'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    const [reviewsRes, logsRes] = await Promise.all([
      supabase.from('reviews').select('*, facilities(name, city, state)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('detention_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    ])
    setReviews(reviewsRes.data || [])
    setLogs(logsRes.data || [])
    setLoading(false)
  }

  const totalDetentionMinutes = logs.reduce((s, l) => s + (l.detention_minutes || 0), 0)

  if (loading) return <div className="loading-spinner"><div className="spinner" />Loading profile...</div>

  return (
    <div className="page">
      <div className="profile-header card">
        <div className="profile-avatar">
          <User size={32} />
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user?.user_metadata?.full_name || 'Driver'}</h1>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-badges">
            <span className="badge badge-orange"><Shield size={12} /> DockWarrior</span>
            {reviews.length >= 10 && <span className="badge badge-green"><Star size={12} /> Road Veteran</span>}
            {reviews.length >= 50 && <span className="badge badge-yellow">⚡ 50 Reviews</span>}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { await signOut(); navigate('/') }}>
          Sign Out
        </button>
      </div>

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
          <Shield size={24} className="pstat-icon" />
          <div className="pstat-value">{totalDetentionMinutes > 0 ? `${Math.round(totalDetentionMinutes / 60)}h` : '0'}</div>
          <div className="pstat-label">Total Detention Time</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 40 }}>
        <div className="accent-line" />
        <h2>Your Reviews</h2>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state">
          <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No reviews yet</h3>
          <p>Search a facility and leave your first review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => (
            <div key={r.id} className="card profile-review">
              <div className="profile-review-top">
                <div>
                  <div className="profile-review-facility">
                    {r.facilities?.name || 'Unknown Facility'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {r.facilities?.city}, {r.facilities?.state}
                  </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
