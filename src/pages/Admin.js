import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, Search, Crown, Clock, Star, RefreshCw, XCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import './Admin.css'

const ADMIN_USER_IDS = ['795d3002-4bb7-44e2-b223-7c34fa272a3b']

function daysRemaining(endDate) {
  if (!endDate) return null
  const ms = new Date(endDate).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, pro: 0, reviews: 0, logs: 0 })
  const [updating, setUpdating] = useState(null)
  const [dayInputs, setDayInputs] = useState({})

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (!ADMIN_USER_IDS.includes(user.id)) {
      toast.error('Access denied')
      navigate('/')
      return
    }
    fetchData()
  }, [user, authLoading])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredUsers(users.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q)
    ))
  }, [search, users])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')

      const { data: reviewCounts } = await supabase
        .from('reviews')
        .select('user_id')

      const { data: logCounts } = await supabase
        .from('detention_logs')
        .select('user_id')

      const subsMap = {}
      subs?.forEach(s => { subsMap[s.user_id] = s })

      const reviewMap = {}
      reviewCounts?.forEach(r => { reviewMap[r.user_id] = (reviewMap[r.user_id] || 0) + 1 })

      const logMap = {}
      logCounts?.forEach(l => { logMap[l.user_id] = (logMap[l.user_id] || 0) + 1 })

      const enriched = (profiles || []).map(p => ({
        ...p,
        subscription: subsMap[p.id] || null,
        review_count: reviewMap[p.id] || 0,
        log_count: logMap[p.id] || 0
      }))

      setUsers(enriched)
      setFilteredUsers(enriched)

      const activeNow = enriched.filter(u => {
        const sub = u.subscription
        if (!sub || sub.status !== 'active' || sub.plan !== 'pro') return false
        if (!sub.current_period_end) return true
        return new Date(sub.current_period_end).getTime() > Date.now()
      })

      setStats({
        total: enriched.length,
        pro: activeNow.length,
        reviews: reviewCounts?.length || 0,
        logs: logCounts?.length || 0
      })
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getDayInput = (userId) => dayInputs[userId] ?? '14'
  const setDayInput = (userId, val) => setDayInputs(prev => ({ ...prev, [userId]: val }))

  const grantTrial = async (userId, days) => {
    const n = parseInt(days, 10)
    if (!n || n <= 0) {
      toast.error('Enter a valid number of days')
      return
    }
    setUpdating(userId)
    try {
      const endDate = new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString()
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        plan: 'pro',
        current_period_end: endDate,
        trial_granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success(`${n}-day trial granted`)
      fetchData()
    } catch (err) {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const extendTrial = async (u, days) => {
    const n = parseInt(days, 10)
    if (!n || n <= 0) {
      toast.error('Enter a valid number of days')
      return
    }
    setUpdating(u.id)
    try {
      const currentEnd = u.subscription?.current_period_end ? new Date(u.subscription.current_period_end) : null
      const base = (currentEnd && currentEnd.getTime() > Date.now()) ? currentEnd.getTime() : Date.now()
      const endDate = new Date(base + n * 24 * 60 * 60 * 1000).toISOString()
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: u.id,
        status: 'active',
        plan: 'pro',
        current_period_end: endDate,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success(`Extended by ${n} days`)
      fetchData()
    } catch (err) {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const grantUnlimited = async (userId) => {
    setUpdating(userId)
    try {
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        plan: 'pro',
        current_period_end: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('Unlimited Pro access granted')
      fetchData()
    } catch (err) {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const revokePro = async (userId) => {
    setUpdating(userId)
    try {
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'cancelled',
        plan: 'free',
        current_period_end: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('Pro access revoked')
      fetchData()
    } catch (err) {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  if (authLoading) return <div className="loading-spinner"><div className="spinner" />Loading...</div>
  if (loading) return <div className="loading-spinner"><div className="spinner" />Loading admin panel...</div>

  return (
    <div className="page admin-page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Shield size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Admin Panel</h2>
        <p>Manage users, subscriptions, and free trials. New signups get a 14-day trial automatically.</p>
      </div>

      <div className="admin-stats">
        <div className="card admin-stat">
          <Users size={20} className="astat-icon" />
          <div className="astat-value">{stats.total}</div>
          <div className="astat-label">Total Users</div>
        </div>
        <div className="card admin-stat">
          <Crown size={20} className="astat-icon" style={{ color: 'var(--orange)' }} />
          <div className="astat-value" style={{ color: 'var(--orange)' }}>{stats.pro}</div>
          <div className="astat-label">Active Pro / Trial</div>
        </div>
        <div className="card admin-stat">
          <Star size={20} className="astat-icon" style={{ color: 'var(--yellow)' }} />
          <div className="astat-value">{stats.reviews}</div>
          <div className="astat-label">Total Reviews</div>
        </div>
        <div className="card admin-stat">
          <Clock size={20} className="astat-icon" style={{ color: 'var(--red)' }} />
          <div className="astat-value">{stats.logs}</div>
          <div className="astat-label">Detention Logs</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 44 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="admin-table-wrap card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Joined</th>
              <th>Reviews</th>
              <th>Logs</th>
              <th>Status</th>
              <th>Days Left</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => {
              const sub = u.subscription
              const remaining = daysRemaining(sub?.current_period_end)
              const isActive = sub?.status === 'active' && sub?.plan === 'pro' && (remaining === null || remaining > 0)
              const isExpiredTrial = sub?.status === 'active' && sub?.plan === 'pro' && remaining !== null && remaining <= 0
              const isUpdating = updating === u.id

              return (
                <tr key={u.id}>
                  <td>
                    <div className="user-name">{u.full_name || 'No name'}</div>
                    <div className="user-id">{u.id?.slice(0, 8)}...</div>
                  </td>
                  <td className="td-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td><span className="badge badge-gray">{u.review_count}</span></td>
                  <td><span className="badge badge-gray">{u.log_count}</span></td>
                  <td>
                    {isActive
                      ? <span className="badge badge-orange"><Crown size={11} /> {sub?.current_period_end ? 'Trial' : 'Pro'}</span>
                      : isExpiredTrial
                      ? <span className="badge badge-gray">Expired</span>
                      : <span className="badge badge-gray">Free</span>}
                  </td>
                  <td className="td-muted">
                    {sub?.current_period_end ? (remaining > 0 ? `${remaining}d` : 'Expired') : (isActive ? '∞' : '—')}
                  </td>
                  <td>
                    <div className="action-btns" style={{ flexWrap: 'wrap', gap: 6 }}>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        style={{ width: 64, padding: '6px 8px', fontSize: 13 }}
                        value={getDayInput(u.id)}
                        onChange={e => setDayInput(u.id, e.target.value)}
                        disabled={isUpdating}
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => grantTrial(u.id, getDayInput(u.id))} disabled={isUpdating}>
                        <Crown size={12} /> Set Trial
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => extendTrial(u, getDayInput(u.id))} disabled={isUpdating}>
                        <Plus size={12} /> Extend
                      </button>
                      {(!isActive || sub?.current_period_end) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => grantUnlimited(u.id)} disabled={isUpdating}>
                          Unlimited
                        </button>
                      )}
                      {(isActive || isExpiredTrial) && (
                        <button className="btn btn-danger btn-sm" onClick={() => revokePro(u.id)} disabled={isUpdating}>
                          <XCircle size={12} /> Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <h3>No users found</h3>
          </div>
        )}
      </div>
    </div>
  )
}
