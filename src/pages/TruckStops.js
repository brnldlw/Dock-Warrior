import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { MapPin, Star, Search, Plus, ChevronRight, Fuel, Droplets, Utensils, Shield, Wifi, Wrench, Lock, Zap, CheckCircle, XCircle, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import './TruckStops.css'

const BRAND_COLORS = {
  'Loves': '#FF4500',
  'Pilot': '#003087',
  'Flying J': '#003087',
  'TA': '#CC0000',
  'Petro': '#CC0000',
  'Kwik Trip': '#E31837',
  'Casey\'s': '#004B87',
}

function StarPicker({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: size }} className={`star ${n <= (hover || value) ? 'filled' : ''}`}
          onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>★</span>
      ))}
    </div>
  )
}

function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: size }} className={`star ${n <= Math.round(rating || 0) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  )
}

function BrandBadge({ brand }) {
  const color = BRAND_COLORS[brand] || 'var(--orange)'
  return (
    <span className="brand-badge" style={{ background: color }}>
      {brand || 'Independent'}
    </span>
  )
}

function StopCard({ stop, onClick }) {
  const avg = stop.avg_rating
  const reviewCount = stop.review_count || 0
  return (
    <div className="stop-card card card-clickable" onClick={() => onClick(stop)}>
      <div className="stop-card-top">
        <div className="stop-info">
          <div className="stop-name">{stop.name}</div>
          <div className="stop-location"><MapPin size={12} /> {stop.city}, {stop.state}</div>
          {stop.brand && <BrandBadge brand={stop.brand} />}
        </div>
        <div className="stop-rating">
          {avg ? (
            <>
              <div className="rating-number">{avg.toFixed(1)}</div>
              <StarDisplay rating={avg} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</div>
            </>
          ) : (
            <div className="no-rating">No reviews</div>
          )}
        </div>
      </div>
      <div className="stop-amenities">
        {stop.has_fuel !== false && <span className="amenity"><Fuel size={12} /> Fuel</span>}
        {stop.avg_shower && <span className="amenity"><Droplets size={12} /> Showers</span>}
        {stop.has_repair_pct > 0.5 && <span className="amenity"><Wrench size={12} /> Repair</span>}
        {stop.has_wifi_pct > 0.5 && <span className="amenity"><Wifi size={12} /> WiFi</span>}
        {stop.has_scales_pct > 0.5 && <span className="amenity"><CheckCircle size={12} /> Scales</span>}
      </div>
      <ChevronRight size={16} className="card-arrow" />
    </div>
  )
}

export default function TruckStops() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const [stops, setStops] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStop, setSelectedStop] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showAddStop, setShowAddStop] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    overall_rating: 0, parking_rating: 0, shower_rating: 0,
    food_rating: 0, staff_rating: 0, security_rating: 0, ease_of_access: 0,
    parking_spaces_available: '', shower_wait_minutes: '', fuel_price: '',
    has_scales: null, has_repair: null, has_wifi: null, notes: ''
  })
  const [newStop, setNewStop] = useState({ name: '', address: '', city: '', state: '', zip: '', brand: '' })

  useEffect(() => { fetchStops() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(stops.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q) ||
      s.brand?.toLowerCase().includes(q)
    ))
  }, [search, stops])

  const fetchStops = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('truck_stops')
      .select('*, truck_stop_reviews(overall_rating, parking_rating, shower_rating, has_repair, has_wifi, has_scales, shower_wait_minutes)')
      .order('name')

    if (data) {
      const enriched = data.map(s => {
        const r = s.truck_stop_reviews || []
        const avg_rating = r.length > 0 ? r.reduce((a, b) => a + b.overall_rating, 0) / r.length : null
        const avg_shower = r.filter(x => x.shower_rating).length > 0
          ? r.filter(x => x.shower_rating).reduce((a, b) => a + b.shower_rating, 0) / r.filter(x => x.shower_rating).length : null
        const has_repair_pct = r.filter(x => x.has_repair !== null).length > 0
          ? r.filter(x => x.has_repair).length / r.filter(x => x.has_repair !== null).length : 0
        const has_wifi_pct = r.filter(x => x.has_wifi !== null).length > 0
          ? r.filter(x => x.has_wifi).length / r.filter(x => x.has_wifi !== null).length : 0
        const has_scales_pct = r.filter(x => x.has_scales !== null).length > 0
          ? r.filter(x => x.has_scales).length / r.filter(x => x.has_scales !== null).length : 0
        return { ...s, avg_rating, avg_shower, has_repair_pct, has_wifi_pct, has_scales_pct, review_count: r.length }
      })
      setStops(enriched)
      setFiltered(enriched)
    }
    setLoading(false)
  }

  const fetchReviews = async (stopId) => {
    const { data } = await supabase
      .from('truck_stop_reviews')
      .select('*')
      .eq('stop_id', stopId)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }

  const handleSelectStop = (stop) => {
    setSelectedStop(stop)
    setShowForm(false)
    fetchReviews(stop.id)
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const urls = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const fileName = `stops/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('review-photos').upload(fileName, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(fileName)
        urls.push(publicUrl)
      }
      setPhotos(prev => [...prev, ...urls])
      toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded`)
    } catch { toast.error('Photo upload failed') }
    finally { setUploading(false) }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in to leave a review'); return }
    if (!isPro) { toast.error('Pro required to submit reviews'); return }
    if (form.overall_rating === 0) { toast.error('Add an overall rating'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('truck_stop_reviews').insert({
        stop_id: selectedStop.id,
        user_id: user.id,
        driver_name: user.user_metadata?.full_name || 'Anonymous Driver',
        overall_rating: form.overall_rating,
        parking_rating: form.parking_rating || null,
        shower_rating: form.shower_rating || null,
        food_rating: form.food_rating || null,
        staff_rating: form.staff_rating || null,
        security_rating: form.security_rating || null,
        ease_of_access: form.ease_of_access || null,
        parking_spaces_available: form.parking_spaces_available ? parseInt(form.parking_spaces_available) : null,
        shower_wait_minutes: form.shower_wait_minutes ? parseInt(form.shower_wait_minutes) : null,
        fuel_price: form.fuel_price ? parseFloat(form.fuel_price) : null,
        has_scales: form.has_scales,
        has_repair: form.has_repair,
        has_wifi: form.has_wifi,
        notes: form.notes || null
      })
      if (error) throw error
      toast.success('Review submitted!')
      setShowForm(false)
      setForm({ overall_rating: 0, parking_rating: 0, shower_rating: 0, food_rating: 0, staff_rating: 0, security_rating: 0, ease_of_access: 0, parking_spaces_available: '', shower_wait_minutes: '', fuel_price: '', has_scales: null, has_repair: null, has_wifi: null, notes: '' })
      setPhotos([])
      fetchReviews(selectedStop.id)
      fetchStops()
    } catch { toast.error('Failed to submit') }
    finally { setSubmitting(false) }
  }

  const handleAddStop = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in required'); return }
    if (!newStop.name || !newStop.city || !newStop.state) { toast.error('Name, city and state required'); return }
    try {
      const { error } = await supabase.from('truck_stops').insert({
        name: newStop.name, address: newStop.address || 'Unknown',
        city: newStop.city, state: newStop.state.toUpperCase(),
        zip: newStop.zip || null, brand: newStop.brand || null
      })
      if (error) throw error
      toast.success('Truck stop added!')
      setShowAddStop(false)
      setNewStop({ name: '', address: '', city: '', state: '', zip: '', brand: '' })
      fetchStops()
    } catch { toast.error('Failed to add stop') }
  }

  const BoolToggle = ({ value, onChange, labelYes, labelNo }) => (
    <div className="bool-toggle">
      <button type="button" className={`bool-btn ${value === true ? 'active-yes' : ''}`} onClick={() => onChange(true)}>
        <CheckCircle size={13} /> {labelYes}
      </button>
      <button type="button" className={`bool-btn ${value === false ? 'active-no' : ''}`} onClick={() => onChange(false)}>
        <XCircle size={13} /> {labelNo}
      </button>
    </div>
  )

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Fuel size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Truck Stops</h2>
        <p>Real driver reviews on parking, showers, food, staff, security and ease of access.</p>
      </div>

      {!selectedStop ? (
        <>
          <div className="stops-toolbar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input className="form-input" style={{ paddingLeft: 44 }} placeholder="Search by name, city, state, or brand..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => setShowAddStop(!showAddStop)}>
              <Plus size={16} /> Add Stop
            </button>
          </div>

          {showAddStop && (
            <div className="card add-stop-form">
              <h3 className="form-title">Add a Truck Stop</h3>
              <form onSubmit={handleAddStop}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" placeholder="e.g. Pilot Travel Center" value={newStop.name} onChange={e => setNewStop(s => ({ ...s, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <select className="form-input" value={newStop.brand} onChange={e => setNewStop(s => ({ ...s, brand: e.target.value }))}>
                      <option value="">Select brand</option>
                      {['Loves', 'Pilot', 'Flying J', 'TA', 'Petro', 'Kwik Trip', "Casey's", 'Independent', 'Other'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Street address" value={newStop.address} onChange={e => setNewStop(s => ({ ...s, address: e.target.value }))} />
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input className="form-input" placeholder="City" value={newStop.city} onChange={e => setNewStop(s => ({ ...s, city: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input className="form-input" placeholder="IL" maxLength={2} value={newStop.state} onChange={e => setNewStop(s => ({ ...s, state: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ZIP</label>
                    <input className="form-input" placeholder="60601" value={newStop.zip} onChange={e => setNewStop(s => ({ ...s, zip: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Add Truck Stop</button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading-spinner"><div className="spinner" />Loading truck stops...</div>
          ) : (
            <div className="stops-list">
              <div className="results-count">{filtered.length} truck stop{filtered.length !== 1 ? 's' : ''}</div>
              {filtered.map(s => <StopCard key={s.id} stop={s} onClick={handleSelectStop} />)}
            </div>
          )}
        </>
      ) : (
        /* STOP DETAIL */
        <div>
          <button className="back-link" onClick={() => { setSelectedStop(null); setShowForm(false) }}>
            ← Back to Truck Stops
          </button>

          <div className="card stop-detail-header">
            <div className="stop-detail-top">
              <div>
                {selectedStop.brand && <BrandBadge brand={selectedStop.brand} />}
                <h1 className="stop-detail-name">{selectedStop.name}</h1>
                <div className="stop-detail-address"><MapPin size={14} /> {selectedStop.address}, {selectedStop.city}, {selectedStop.state}</div>
              </div>
              {selectedStop.avg_rating && (
                <div className="stop-detail-rating">
                  <div className="rating-number" style={{ fontSize: 48 }}>{selectedStop.avg_rating.toFixed(1)}</div>
                  <StarDisplay rating={selectedStop.avg_rating} size={18} />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{selectedStop.review_count} reviews</div>
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="stop-ratings-grid">
              {[
                { label: 'Parking', key: 'parking_rating', icon: <MapPin size={16} /> },
                { label: 'Showers', key: 'shower_rating', icon: <Droplets size={16} /> },
                { label: 'Food', key: 'food_rating', icon: <Utensils size={16} /> },
                { label: 'Staff', key: 'staff_rating', icon: <Shield size={16} /> },
                { label: 'Security', key: 'security_rating', icon: <Lock size={16} /> },
                { label: 'Access', key: 'ease_of_access', icon: <ChevronRight size={16} /> },
              ].map(({ label, key, icon }) => {
                const vals = reviews.filter(r => r[key])
                const avg = vals.length > 0 ? vals.reduce((a, b) => a + b[key], 0) / vals.length : null
                return (
                  <div key={key} className="stop-rating-item">
                    <div className="stop-rating-icon">{icon}</div>
                    <div className="stop-rating-label">{label}</div>
                    {avg ? (
                      <>
                        <div className="stop-rating-score">{avg.toFixed(1)}</div>
                        <StarDisplay rating={avg} size={11} />
                      </>
                    ) : <div className="stop-rating-na">No data</div>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="review-action-bar">
            <h2 className="reviews-title">Reviews <span className="review-count-badge">{reviews.length}</span></h2>
            {!isPro ? (
              <Link to="/pricing" className="btn btn-secondary btn-sm">
                <Zap size={14} /> Pro to Review
              </Link>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                <Plus size={16} /> {showForm ? 'Cancel' : 'Add Review'}
              </button>
            )}
          </div>

          {!isPro && (
            <div className="pro-gate-banner">
              <Zap size={16} />
              <span>Free members can read reviews. <Link to="/pricing" style={{ color: 'var(--orange)' }}>Upgrade to Pro</Link> to submit reviews, see full details, and access all ratings.</span>
            </div>
          )}

          {showForm && isPro && (
            <div className="card review-form" style={{ marginBottom: 24 }}>
              <h3 className="form-title">Your Review</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Overall Rating *</label><StarPicker value={form.overall_rating} onChange={v => setForm(f => ({ ...f, overall_rating: v }))} /></div>
                  <div className="form-group"><label className="form-label">Ease of Access</label><StarPicker value={form.ease_of_access} onChange={v => setForm(f => ({ ...f, ease_of_access: v }))} /></div>
                  <div className="form-group"><label className="form-label">Parking</label><StarPicker value={form.parking_rating} onChange={v => setForm(f => ({ ...f, parking_rating: v }))} /></div>
                  <div className="form-group"><label className="form-label">Showers</label><StarPicker value={form.shower_rating} onChange={v => setForm(f => ({ ...f, shower_rating: v }))} /></div>
                  <div className="form-group"><label className="form-label">Food</label><StarPicker value={form.food_rating} onChange={v => setForm(f => ({ ...f, food_rating: v }))} /></div>
                  <div className="form-group"><label className="form-label">Staff</label><StarPicker value={form.staff_rating} onChange={v => setForm(f => ({ ...f, staff_rating: v }))} /></div>
                  <div className="form-group"><label className="form-label">Security</label><StarPicker value={form.security_rating} onChange={v => setForm(f => ({ ...f, security_rating: v }))} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Parking Spots Available</label><input className="form-input" type="number" placeholder="e.g. 45" value={form.parking_spaces_available} onChange={e => setForm(f => ({ ...f, parking_spaces_available: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Shower Wait (minutes)</label><input className="form-input" type="number" placeholder="e.g. 20" value={form.shower_wait_minutes} onChange={e => setForm(f => ({ ...f, shower_wait_minutes: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Diesel Price ($/gal)</label><input className="form-input" type="number" step="0.001" placeholder="e.g. 3.899" value={form.fuel_price} onChange={e => setForm(f => ({ ...f, fuel_price: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label className="form-label">CAT Scales?</label><BoolToggle value={form.has_scales} onChange={v => setForm(f => ({ ...f, has_scales: v }))} labelYes="Yes" labelNo="No" /></div>
                <div className="form-group"><label className="form-label">Truck Repair?</label><BoolToggle value={form.has_repair} onChange={v => setForm(f => ({ ...f, has_repair: v }))} labelYes="Yes" labelNo="No" /></div>
                <div className="form-group"><label className="form-label">WiFi?</label><BoolToggle value={form.has_wifi} onChange={v => setForm(f => ({ ...f, has_wifi: v }))} labelYes="Yes" labelNo="No" /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" placeholder="What do other drivers need to know?" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
                <div className="form-group">
                  <label className="form-label">Photos</label>
                  <label className="photo-upload-btn">
                    <Camera size={15} /> {uploading ? 'Uploading...' : `Add Photos ${photos.length > 0 ? `(${photos.length})` : ''}`}
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</button>
              </form>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state">
              <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <h3>No reviews yet</h3>
              <p>Be the first driver to review this stop.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reviews.map(r => (
                <div key={r.id} className="card stop-review">
                  <div className="stop-review-top">
                    <div>
                      <div className="reviewer-name">{r.driver_name || 'Anonymous Driver'}</div>
                      <StarDisplay rating={r.overall_rating} size={14} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="stop-review-stats">
                    {r.parking_spaces_available && <span className="stat-chip"><MapPin size={11} /><strong>{r.parking_spaces_available}</strong> spots</span>}
                    {r.shower_wait_minutes && <span className="stat-chip"><Droplets size={11} /><strong>{r.shower_wait_minutes}min</strong> shower wait</span>}
                    {r.fuel_price && <span className="stat-chip"><Fuel size={11} /><strong>${r.fuel_price}</strong>/gal</span>}
                    {r.has_scales !== null && <span className={`badge ${r.has_scales ? 'badge-green' : 'badge-gray'}`}>{r.has_scales ? '✓' : '✗'} Scales</span>}
                    {r.has_repair !== null && <span className={`badge ${r.has_repair ? 'badge-green' : 'badge-gray'}`}>{r.has_repair ? '✓' : '✗'} Repair</span>}
                    {r.has_wifi !== null && <span className={`badge ${r.has_wifi ? 'badge-green' : 'badge-gray'}`}>{r.has_wifi ? '✓' : '✗'} WiFi</span>}
                  </div>
                  {r.notes && <p className="review-notes">"{r.notes}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}