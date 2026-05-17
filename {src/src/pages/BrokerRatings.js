import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Star, DollarSign, Clock, AlertTriangle, Plus, CheckCircle, XCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import './BrokerRatings.css'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= (hover || value) ? 'filled' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}>★</span>
      ))}
    </div>
  )
}

function PaySpeedBadge({ days }) {
  if (!days) return null
  const color = days <= 30 ? 'badge-green' : days <= 60 ? 'badge-yellow' : 'badge-red'
  return <span className={`badge ${color}`}><Clock size={11} /> Pays in ~{days} days</span>
}

export default function BrokerRatings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [brokers, setBrokers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    broker_name: '',
    overall_rating: 0,
    payment_speed_days: '',
    paid_detention: null,
    communication_rating: 0,
    would_work_again: null,
    notes: '',
    load_type: ''
  })

  useEffect(() => {
    fetchBrokers()
  }, [])

  const fetchBrokers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('broker_reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      const grouped = {}
      data.forEach(r => {
        const key = r.broker_name.toLowerCase().trim()
        if (!grouped[key]) {
          grouped[key] = { name: r.broker_name, reviews: [] }
        }
        grouped[key].reviews.push(r)
      })

      const list = Object.values(grouped).map(b => {
        const reviews = b.reviews
        const avg_rating = reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length
        const avg_payment = reviews.filter(r => r.payment_speed_days).length > 0
          ? reviews.filter(r => r.payment_speed_days).reduce((s, r) => s + r.payment_speed_days, 0) / reviews.filter(r => r.payment_speed_days).length
          : null
        const detention_reviews = reviews.filter(r => r.paid_detention !== null)
        const detention_rate = detention_reviews.length > 0
          ? detention_reviews.filter(r => r.paid_detention).length / detention_reviews.length : null
        const would_work = reviews.filter(r => r.would_work_again !== null)
        const work_again_rate = would_work.length > 0
          ? would_work.filter(r => r.would_work_again).length / would_work.length : null
        return { ...b, avg_rating, avg_payment, detention_rate, work_again_rate, review_count: reviews.length }
      }).sort((a, b) => b.review_count - a.review_count)

      setBrokers(list)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!form.broker_name.trim()) { toast.error('Enter the broker name'); return }
    if (form.overall_rating === 0) { toast.error('Add an overall rating'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('broker_reviews').insert({
        user_id: user.id,
        broker_name: form.broker_name.trim(),
        overall_rating: form.overall_rating,
        payment_speed_days: form.payment_speed_days ? parseInt(form.payment_speed_days) : null,
        paid_detention: form.paid_detention,
        communication_rating: form.communication_rating || null,
        would_work_again: form.would_work_again,
        notes: form.notes || null,
        load_type: form.load_type || null
      })
      if (error) throw error
      toast.success('Broker rating submitted!')
      setShowForm(false)
      setForm({ broker_name: '', overall_rating: 0, payment_speed_days: '', paid_detention: null, communication_rating: 0, would_work_again: null, notes: '', load_type: '' })
      fetchBrokers()
    } catch (err) {
      toast.error('Failed to submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = brokers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><DollarSign size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Broker Ratings</h2>
        <p>Know who pays fast and who ghosts you. Rated by drivers who've hauled their loads.</p>
      </div>

      {/* SEARCH + ADD */}
      <div className="broker-toolbar">
        <div className="broker-search-wrap">
          <Search size={18} className="broker-search-icon" />
          <input
            className="form-input broker-search"
            placeholder="Search broker name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => { if (!user) { navigate('/login'); return; } setShowForm(!showForm) }}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Rate a Broker'}
        </button>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <div className="card broker-form">
          <h3 className="form-title">Rate a Broker</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Broker Company Name *</label>
                <input className="form-input" placeholder="e.g. Echo Global Logistics" value={form.broker_name} onChange={e => setForm(f => ({ ...f, broker_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Load Type</label>
                <input className="form-input" placeholder="e.g. Dry van, Reefer, Flatbed" value={form.load_type} onChange={e => setForm(f => ({ ...f, load_type: e.target.value }))} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Overall Rating *</label>
                <StarPicker value={form.overall_rating} onChange={v => setForm(f => ({ ...f, overall_rating: v }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Communication Rating</label>
                <StarPicker value={form.communication_rating} onChange={v => setForm(f => ({ ...f, communication_rating: v }))} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">How many days to pay? (approx)</label>
                <input className="form-input" type="number" placeholder="e.g. 30" value={form.payment_speed_days} onChange={e => setForm(f => ({ ...f, payment_speed_days: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Did they pay detention?</label>
                <div className="bool-toggle">
                  <button type="button" className={`bool-btn ${form.paid_detention === true ? 'active-yes' : ''}`} onClick={() => setForm(f => ({ ...f, paid_detention: true }))}><CheckCircle size={14} /> Yes</button>
                  <button type="button" className={`bool-btn ${form.paid_detention === false ? 'active-no' : ''}`} onClick={() => setForm(f => ({ ...f, paid_detention: false }))}><XCircle size={14} /> No</button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Would you work with them again?</label>
              <div className="bool-toggle">
                <button type="button" className={`bool-btn ${form.would_work_again === true ? 'active-yes' : ''}`} onClick={() => setForm(f => ({ ...f, would_work_again: true }))}><CheckCircle size={14} /> Yes</button>
                <button type="button" className={`bool-btn ${form.would_work_again === false ? 'active-no' : ''}`} onClick={() => setForm(f => ({ ...f, would_work_again: false }))}><XCircle size={14} /> No</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input" placeholder="Payment experience, communication, anything other drivers need to know..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </div>
      )}

      {/* BROKER LIST */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" />Loading brokers...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>{search ? 'No brokers found' : 'No broker ratings yet'}</h3>
          <p>Be the first to rate a broker and help other drivers.</p>
        </div>
      ) : (
        <div className="broker-list">
          {filtered.map((b, i) => (
            <div key={i} className="broker-card card">
              <div className="broker-card-top">
                <div>
                  <div className="broker-name">{b.name}</div>
                  <div className="broker-review-count">{b.review_count} driver review{b.review_count !== 1 ? 's' : ''}</div>
                </div>
                <div className="broker-rating">
                  <div className="rating-number">{b.avg_rating.toFixed(1)}</div>
                  <div className="stars">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ fontSize: 14 }} className={`star ${n <= Math.round(b.avg_rating) ? 'filled' : ''}`}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="divider" style={{ margin: '12px 0' }} />
              <div className="broker-stats">
                {b.avg_payment && <PaySpeedBadge days={Math.round(b.avg_payment)} />}
                {b.detention_rate !== null && (
                  <span className={`badge ${b.detention_rate >= 0.6 ? 'badge-green' : b.detention_rate >= 0.3 ? 'badge-yellow' : 'badge-red'}`}>
                    {b.detention_rate >= 0.6 ? <CheckCircle size={11} /> : <XCircle size={11} />}
                    Detention paid {Math.round(b.detention_rate * 100)}%
                  </span>
                )}
                {b.work_again_rate !== null && (
                  <span className={`badge ${b.work_again_rate >= 0.6 ? 'badge-green' : 'badge-red'}`}>
                    {Math.round(b.work_again_rate * 100)}% would work again
                  </span>
                )}
              </div>
              {b.reviews.filter(r => r.notes).slice(0, 2).map((r, j) => (
                <p key={j} className="broker-note">"{r.notes}"</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
