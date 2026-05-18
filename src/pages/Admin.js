import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, Search, Crown, Clock, Star, DollarSign, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import './Admin.css'

// Add your Supabase user ID here to grant admin access
const ADMIN_USER_IDS = ['795d3002-4bb7-44e2-b223-7c34fa272a3b']
  // Add your user ID from Supabase → Authentication → Users
  // e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, pro: 0, reviews: 0, logs: 0 })
  const [activeTab, setActiveTab] = useState('users')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    // Check admin access
    if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(user.id)) {
      toast.error('Access denied')
      navigate('/')
      return
    }
    fetchData()
  }, [user])

  useEffect(() => {
    const q = search.toLowerCase()
    setFilteredUsers(users.filter(u =>
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    ))
  }, [search, users])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch subscriptions
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')

      // Fetch review counts per user
      const { data: reviewCounts } = await supabase
        .from('reviews')
        .select('user_id')

      // Fetch detention log counts
      const { data: logCounts } = await supabase
        .from('detention_logs')
        .select('user_id')

      const subsMap = {}
      subs?.forEach(s => { subsMap[s.user_id] = s })

      const reviewMap = {}
      reviewCounts?.forEach(r => {
        reviewMap[r.user_id] = (reviewMap[r.user_id] || 0) + 1
      })

      const logMap = {}
      logCounts?.forEach(l => {
        logMap[l.user_id] = (logMap[l.user_id] || 0) + 1
      })

      const enriched = (profiles || []).map(p => ({
        ...p,
        subscription: subsMap[p.id] || null,
        review_count: reviewMap[p.id] || 0,
        log_count: logMap[p.id] || 0
      }))

      setUsers(enriched)
      setFilteredUsers(enriched)
      setStats({
        total: enriched.length,
        pro: enriched.filter(u => u.subscription?.status === 'active').length,
        reviews: reviewCounts?.length || 0,
        logs: logCounts?.length || 0
      })
    } catch (err) {
      toast.error('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const grantPro = async (userId, trialDays = 0) => {
    setUpdating(userId)
    try {
      const endDate = trialDays > 0
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'active',
          plan: 'pro',
          current_period_end: endDate,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      toast.success(trialDays > 0 ? `${trialDays}-day free trial granted` : 'Pro access granted')
      fetchData()
    } catch (err) {
      toast.error('Failed to update subscription')
    } finally {
      setUpdating(null)
    }
  }

  const revokePro = async (userId) => {
    setUpdating(userId)
    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'cancelled',
          plan: 'free',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      toast.success('Pro access revoked')
      fetchData()
    } catch (err) {
      toast.error('Failed to update subscription')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" />Loading admin panel...</div>

  return (
    <div className="page admin-page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Shield size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Admin Panel</h2>
        <p>Manage users, subscriptions, and free trials.</p>
      </div>

      {ADMIN_USER_IDS.length === 0 && (
        <div className="admin-warning">
          <AlertTriangle size={16} />
          <span>Add your user ID to the ADMIN_USER_IDS array in Admin.js to restrict access to this panel.</span>
        </div>
      )}

      {/* STATS */}
      <div className="admin-stats">
        <div className="card admin-stat">
          <Users size={20} className="astat-icon" />
          <div className="astat-value">{stats.total}</div>
          <div className="astat-label">Total Users</div>
        </div>
        <div className="card admin-stat">
          <Crown size={20} className="astat-icon" style={{ color: 'var(--orange)' }} />
          <div className="astat-value" style={{ color: 'var(--orange)' }}>{stats.pro}</div>
          <div className="astat-label">Pro Members</div>
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

      {/* SEARCH */}
      <div className="admin-toolbar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 44 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* USERS TABLE */}
      <div className="admin-table-wrap card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Joined</th>
              <th>Reviews</th>
              <th>Det. Logs</th>
              <th>Status</th>
              <th>Trial Ends</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => {
              const isPro = u.subscription?.status === 'active'
              const trialEnd = u.subscription?.current_period_end
              const isUpdating = updating === u.id
              return (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-name">{u.full_name || 'No name'}</div>
                      <div className="user-id">{u.id?.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="td-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td><span className="badge badge-gray">{u.review_count}</span></td>
                  <td><span className="badge badge-gray">{u.log_count}</span></td>
                  <td>
                    {isPro ? (
                      <span className="badge badge-orange"><Crown size={11} /> Pro</span>
                    ) : (
                      <span className="badge badge-gray">Free</span>
                    )}
                  </td>
                  <td className="td-muted">
                    {trialEnd ? new Date(trialEnd).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div className="action-btns">
                      {!isPro ? (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => grantPro(u.id)}
                            disabled={isUpdating}
                          >
                            <Crown size={12} /> Grant Pro
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => grantPro(u.id, 14)}
                            disabled={isUpdating}
                          >
                            14-Day Trial
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => grantPro(u.id, 30)}
                            disabled={isUpdating}
                          >
                            30-Day Trial
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => revokePro(u.id)}
                          disabled={isUpdating}
                        >
                          <XCircle size={12} /> Revoke Pro
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
            <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3>No users found</h3>
          </div>
        )}
      </div>
    </div>
  )
}
