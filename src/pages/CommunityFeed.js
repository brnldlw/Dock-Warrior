import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, ThumbsUp, AlertTriangle, Clock, MapPin, Truck, DollarSign, Shield, Plus, RefreshCw, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import './CommunityFeed.css'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <MessageSquare size={14} /> },
  { id: 'alert', label: 'Road Alert', icon: <AlertTriangle size={14} /> },
  { id: 'dock', label: 'Dock Intel', icon: <Truck size={14} /> },
  { id: 'broker', label: 'Broker Watch', icon: <DollarSign size={14} /> },
  { id: 'weather', label: 'Weather', icon: <Clock size={14} /> },
  { id: 'safety', label: 'Safety', icon: <Shield size={14} /> },
  { id: 'general', label: 'General', icon: <MessageSquare size={14} /> },
]

const CATEGORY_COLORS = {
  alert: 'badge-red',
  dock: 'badge-orange',
  broker: 'badge-yellow',
  weather: 'badge-blue',
  safety: 'badge-green',
  general: 'badge-gray',
}

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function CommunityFeed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [userUpvotes, setUserUpvotes] = useState(new Set())
  const [form, setForm] = useState({
    content: '',
    category: 'general',
    state: ''
  })

  useEffect(() => {
    fetchPosts()
    if (user) fetchUserUpvotes()

    // Auto refresh every 60 seconds
    const interval = setInterval(fetchPosts, 60000)
    return () => clearInterval(interval)
  }, [user])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setPosts(data || [])
    setLoading(false)
  }

  const fetchUserUpvotes = async () => {
    const { data } = await supabase
      .from('post_upvotes')
      .select('post_id')
      .eq('user_id', user.id)
    setUserUpvotes(new Set((data || []).map(u => u.post_id)))
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
        driver_name: user.user_metadata?.full_name || 'Anonymous Driver',
        content: form.content.trim(),
        category: form.category,
        state: form.state || null
      })
      if (error) throw error
      toast.success('Posted!')
      setShowForm(false)
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

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, upvotes: p.upvotes + (hasUpvoted ? -1 : 1) } : p
    ))
    setUserUpvotes(prev => {
      const next = new Set(prev)
      hasUpvoted ? next.delete(post.id) : next.add(post.id)
      return next
    })

    try {
      if (hasUpvoted) {
        await supabase.from('post_upvotes').delete()
          .eq('post_id', post.id).eq('user_id', user.id)
        await supabase.from('community_posts').update({ upvotes: Math.max(0, post.upvotes - 1) }).eq('id', post.id)
      } else {
        await supabase.from('post_upvotes').insert({ post_id: post.id, user_id: user.id })
        await supabase.from('community_posts').update({ upvotes: post.upvotes + 1 }).eq('id', post.id)
      }
    } catch {
      // Revert on error
      fetchPosts()
      if (user) fetchUserUpvotes()
    }
  }

  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.category === activeCategory)

  const charCount = form.content.length

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><MessageSquare size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Driver Feed</h2>
        <p>Real-time alerts and intel from drivers on the road. No BS, no brokers, just drivers.</p>
      </div>

      {/* POST BUTTON */}
      <div className="feed-toolbar">
        <div className="feed-categories">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`feed-cat-btn ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="feed-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchPosts}>
            <RefreshCw size={14} /> Refresh
          </button>
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
              <Plus size={14} /> {showForm ? 'Cancel' : 'Post Alert'}
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In to Post
            </Link>
          )}
        </div>
      </div>

      {/* POST FORM */}
      {showForm && (
        <div className="card feed-form">
          <form onSubmit={handlePost}>
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">State (optional)</label>
                <select className="form-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                  <option value="">All States</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">
                Your Alert
                <span style={{ color: charCount > 450 ? 'var(--red)' : 'var(--text-muted)', marginLeft: 8, fontWeight: 400 }}>
                  {charCount}/500
                </span>
              </label>
              <textarea
                className="form-input"
                placeholder="What do other drivers need to know right now? Road closures, bad docks, broker issues, weather, anything..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={4}
                maxLength={500}
              />
            </div>
            <div className="feed-form-footer">
              <span className="feed-form-hint">
                <Shield size={12} /> Keep it factual and respectful. No personal attacks.
              </span>
              <button type="submit" className="btn btn-primary" disabled={posting || !form.content.trim()}>
                {posting ? 'Posting...' : 'Post Alert'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FEED */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" />Loading feed...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No posts yet</h3>
          <p>Be the first warrior to post an alert.</p>
        </div>
      ) : (
        <div className="feed-list">
          {filtered.map(post => {
            const hasUpvoted = userUpvotes.has(post.id)
            const catColor = CATEGORY_COLORS[post.category] || 'badge-gray'
            const catLabel = CATEGORIES.find(c => c.id === post.category)?.label || 'General'
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
                  <div className="post-time">{timeAgo(post.created_at)}</div>
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
