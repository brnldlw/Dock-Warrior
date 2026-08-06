import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MapPin, ThumbsUp, Flag, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import './CommunityFeed.css'

const CATEGORIES = [
  { id: 'alert', label: 'Road Alert', icon: '🚨', color: 'badge-red' },
  { id: 'dock', label: 'Dock Intel', icon: '🏭', color: 'badge-orange' },
  { id: 'broker', label: 'Broker Watch', icon: '⚖️', color: 'badge-yellow' },
  { id: 'weather', label: 'Weather', icon: '🌩️', color: 'badge-blue' },
  { id: 'safety', label: 'Safety', icon: '🛡️', color: 'badge-green' },
  { id: 'general', label: 'General', icon: '💬', color: 'badge-gray' },
]

const CATEGORY_COLORS = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]))

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function CommunityFeed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [posting, setPosting] = useState(false)
  const [userUpvotes, setUserUpvotes] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const [reportedPosts, setReportedPosts] = useState(new Set())
  const [blockedUsers, setBlockedUsers] = useState(new Set())
  const [form, setForm] = useState({
    content: '',
    category: 'general',
    state: ''
  })

  useEffect(() => {
    fetchPosts()
    const interval = setInterval(fetchPosts, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('post_upvotes')
      .select('post_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setUserUpvotes(new Set((data || []).map(u => u.post_id)))
      })
  }, [user])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setPosts(data || [])
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in to post'); return }
    if (!form.content.trim()) { toast.error('Write something first'); return }
    if (form.content.length > 500) { toast.error('Keep it under 500 characters'); return }
    setPosting(true)
    try {
      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        driver_name: user.user_metadata?.full_name || 'Driver',
        content: form.content.trim(),
        category: form.category,
        state: form.state || null,
        upvotes: 0
      })
      if (error) throw error
      toast.success('Posted!')
      setForm({ content: '', category: 'general', state: '' })
      fetchPosts()
    } catch {
      toast.error('Failed to post')
    } finally {
      setPosting(false)
    }
  }

  const handleUpvote = async (post) => {
    if (!user) { toast.error('Sign in to upvote'); return }
    const hasUpvoted = userUpvotes.has(post.id)
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, upvotes: p.upvotes + (hasUpvoted ? -1 : 1) } : p
    ))
    setUserUpvotes(prev => {
      const next = new Set(prev)
      hasUpvoted ? next.delete(post.id) : next.add(post.id)
      return next
    })
    if (hasUpvoted) {
      await supabase.from('post_upvotes').delete()
        .eq('user_id', user.id).eq('post_id', post.id)
      await supabase.from('community_posts').update({ upvotes: post.upvotes - 1 }).eq('id', post.id)
    } else {
      await supabase.from('post_upvotes').insert({ user_id: user.id, post_id: post.id })
      await supabase.from('community_posts').update({ upvotes: post.upvotes + 1 }).eq('id', post.id)
    }
  }

  const handleReport = async (post) => {
    if (!user) { toast.error('Sign in to report'); return }
    if (reportedPosts.has(post.id)) { toast.error('Already reported'); return }
    try {
      await supabase.from('community_posts').update({
        reported: true,
        report_count: (post.report_count || 0) + 1
      }).eq('id', post.id)
      setReportedPosts(prev => new Set([...prev, post.id]))
      toast.success('Post reported. Our team will review it within 24 hours.')
    } catch {
      toast.error('Failed to report')
    }
  }

  const handleBlock = async (post) => {
    if (!user) { toast.error('Sign in to block'); return }
    if (blockedUsers.has(post.user_id)) { toast.error('User already blocked'); return }
    setBlockedUsers(prev => new Set([...prev, post.user_id]))
    setPosts(prev => prev.filter(p => p.user_id !== post.user_id))
    try {
      await supabase.from('community_posts').update({ reported: true }).eq('user_id', post.user_id)
    } catch {}
    toast.success('User blocked and removed from your feed. Our team has been notified.')
  }

  const filtered = filter === 'all'
    ? posts.filter(p => !blockedUsers.has(p.user_id))
    : posts.filter(p => p.category === filter && !blockedUsers.has(p.user_id))

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2>Driver Feed</h2>
        <p>Real-time alerts and intel from drivers on the road. By drivers, for drivers.</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          By posting, you agree to our{' '}
          <a href="https://dockwarrior.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)' }}>Terms of Use</a>
          {' '}— no objectionable or abusive content. Violations are removed within 24 hours.
        </p>
      </div>

      {/* CATEGORY FILTER */}
      <div className="feed-filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.id} className={`filter-btn ${filter === c.id ? 'active' : ''}`} onClick={() => setFilter(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* POST FORM */}
      {user ? (
        <form onSubmit={handlePost} className="card post-form">
          <div className="post-form-row">
            <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <select className="form-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
              <option value="">All States</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea
            className="form-input post-textarea"
            placeholder="Share a road alert, dock intel, broker warning, or anything drivers need to know..."
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={3}
            maxLength={500}
          />
          <div className="post-form-footer">
            <span className="char-count">{form.content.length}/500</span>
            <button type="submit" className="btn btn-primary" disabled={posting || !form.content.trim()}>
              {posting ? 'Posting...' : 'Post Alert'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ padding: 20, textAlign: 'center', marginBottom: 20 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Sign in to post alerts and join the conversation.</p>
        </div>
      )}

      {/* POSTS */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No posts yet</h3>
          <p>Be the first to post an alert.</p>
        </div>
      ) : (
        <div className="feed-posts">
          {filtered.map(post => {
            const hasUpvoted = userUpvotes.has(post.id)
            const catColor = CATEGORY_COLORS[post.category] || 'badge-gray'
            const catLabel = CATEGORIES.find(c => c.id === post.category)?.label || 'General'
            const isReported = reportedPosts.has(post.id)
            return (
              <div key={post.id} className="feed-post card">
                <div className="post-header">
                  <div className="post-meta">
                    <span className={`badge ${catColor}`}>
                      {CATEGORIES.find(c => c.id === post.category)?.icon}
                      {' '}{catLabel}
                    </span>
                    {post.state && (
                      <span className="badge badge-gray">
                        <MapPin size={10} /> {post.state}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="post-time">{timeAgo(post.created_at)}</div>
                    {user && post.user_id !== user.id && (
                      <>
                        <button
                          onClick={() => handleReport(post)}
                          title="Report this post"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isReported ? 'var(--orange)' : 'var(--text-muted)', padding: 4 }}
                        >
                          <Flag size={13} />
                        </button>
                        <button
                          onClick={() => handleBlock(post)}
                          title="Block this user"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, fontSize: 12 }}
                        >
                          🚫
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <span className="post-driver">{post.driver_name || 'Anonymous Driver'}</span>
                  <button
                    className={`upvote-btn ${hasUpvoted ? 'upvoted' : ''}`}
                    onClick={() => handleUpvote(post)}
                  >
                    <ThumbsUp size={14} />
                    <span>{post.upvotes || 0}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}