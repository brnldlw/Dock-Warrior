import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  MapPin, Clock, Star, ChevronLeft, CheckCircle, XCircle,
  Droplets, Users, DollarSign, AlertTriangle, Plus, Camera
} from 'lucide-react'
import toast from 'react-hot-toast'
import './FacilityDetail.css'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={`star ${n <= (hover || value) ? 'filled' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </div>
  )
}

function StarDisplay({ rating, size = 16 }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: size }} className={`star ${n <= Math.round(rating || 0) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  )
}

function BoolToggle({ value, onChange, labelYes, labelNo }) {
  return (
    <div className="bool-toggle">
      <button
        type="button"
        className={`bool-btn ${value === true ? 'active-yes' : ''}`}
        onClick={() => onChange(true)}
      >
        <CheckCircle size={14} /> {labelYes}
      </button>
      <button
        type="button"
        className={`bool-btn ${value === false ? 'active-no' : ''}`}
        onClick={() => onChange(false)}
      >
        <XCircle size={14} /> {labelNo}
      </button>
    </div>
  )
}

export default function FacilityDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [facility, setFacility] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    overall_rating: 0,
    driver_respect_rating: 0,
    wait_time_minutes: '',
    detention_honored: null,
    lumper_required: null,
    lumper_cost: '',
    bathroom_access: null,
    notes: ''
  })

  useEffect(() => {
    fetchFacilityAndReviews()
  }, [id])

  const fetchFacilityAndReviews = async () => {
    setLoading(true)
    try {
      const [facilityRes, reviewsRes] = await Promise.all([
        supabase.from('facilities').select('*').eq('id', id).single(),
        supabase.from('reviews').select('*').eq('facility_id', id).order('created_at', { ascending: false })
      ])
      if (facilityRes.error) throw facilityRes.error
      setFacility(facilityRes.data)
      setReviews(reviewsRes.data || [])
    } catch (err) {
      toast.error('Failed to load facility')
      navigate('/search')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const urls = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage
          .from('review-photos')
          .upload(fileName, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName)
        urls.push(publicUrl)
      }
      setPhotos(prev => [...prev, ...urls])
      toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded`)
    } catch (err) {
      toast.error('Photo upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Sign in to leave a review')
      navigate('/login')
      return
    }
    if (form.overall_rating === 0) {
      toast.error('Please add an overall rating')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        facility_id: id,
        user_id: user.id,
        driver_name: user.user_metadata?.full_name || 'Anonymous Driver',
        overall_rating: form.overall_rating,
        driver_respect_rating: form.driver_respect_rating || null,
        wait_time_minutes: form.wait_time_minutes ? parseInt(form.wait_time_minutes) : null,
        detention_honored: form.detention_honored,
        lumper_required: form.lumper_required,
        lumper_cost: form.lumper_cost ? parseFloat(form.lumper_cost) : null,
        bathroom_access: form.bathroom_access,
        notes: form.notes || null,
        photos: photos.length > 0 ? photos : null
      })
      if (error) throw error
      toast.success('Review submitted. Warriors appreciate you!')
      setShowForm(false)
      setForm({ overall_rating: 0, driver_respect_rating: 0, wait_time_minutes: '', detention_honored: null, lumper_required: null, lumper_cost: '', bathroom_access: null, notes: '' })
      setPhotos([])
      fetchFacilityAndReviews()
    } catch (err) {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" />Loading facility...</div>
  if (!facility) return null

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length : 0
  const avgWait = reviews.filter(r => r.wait_time_minutes).length > 0
    ? reviews.filter(r => r.wait_time_minutes).reduce((s, r) => s + r.wait_time_minutes, 0) /
      reviews.filter(r => r.wait_time_minutes).length : null
  const detentionReviews = reviews.filter(r => r.detention_honored !== null)
  const detentionRate = detentionReviews.length > 0
    ? detentionReviews.filter(r => r.detention_honored).length / detentionReviews.length : null
  const lumperReviews = reviews.filter(r => r.lumper_required !== null)
  const lumperRate = lumperReviews.length > 0
    ? lumperReviews.filter(r => r.lumper_required).length / lumperReviews.length : null

  return (
    <div className="page">
      <Link to="/search" className="back-link">
        <ChevronLeft size={16} /> Back to Search
      </Link>

      {/* FACILITY HEADER */}
      <div className="facility-header card">
        <div className="facility-hero-top">
          <div>
            <div className="badge badge-gray" style={{ marginBottom: 12 }}>{facility.facility_type}</div>
            <h1 className="facility-hero-name">{facility.name}</h1>
            <div className="facility-hero-address">
              <MapPin size={15} />
              {facility.address}, {facility.city}, {facility.state} {facility.zip}
            </div>
          </div>
          {avgRating > 0 && (
            <div className="facility-hero-rating">
              <div className="rating-number" style={{ fontSize: 56 }}>{avgRating.toFixed(1)}</div>
              <StarDisplay rating={avgRating} size={20} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        <div className="divider" />

        {/* STATS SUMMARY */}
        <div className="facility-stats">
          <div className="facility-stat">
            <Clock size={18} className="stat-icon" />
            <div>
              <div className="stat-val">{avgWait ? `${Math.round(avgWait)} min` : '—'}</div>
              <div className="stat-lbl">Avg Wait</div>
            </div>
          </div>
          <div className="facility-stat">
            <DollarSign size={18} className="stat-icon" />
            <div>
              <div className={`stat-val ${detentionRate == null ? '' : detentionRate >= 0.6 ? 'text-green' : detentionRate >= 0.3 ? 'text-yellow' : 'text-red'}`}>
                {detentionRate == null ? '—' : `${Math.round(detentionRate * 100)}%`}
              </div>
              <div className="stat-lbl">Detention Paid</div>
            </div>
          </div>
          <div className="facility-stat">
            <AlertTriangle size={18} className="stat-icon" />
            <div>
              <div className="stat-val">
                {lumperRate == null ? '—' : lumperRate >= 0.5 ? 'Usually' : 'Rarely'}
              </div>
              <div className="stat-lbl">Lumper Required</div>
            </div>
          </div>
          <div className="facility-stat">
            <Droplets size={18} className="stat-icon" />
            <div>
              <div className="stat-val">
                {reviews.filter(r => r.bathroom_access !== null).length === 0 ? '—' :
                  reviews.filter(r => r.bathroom_access).length / reviews.filter(r => r.bathroom_access !== null).length >= 0.5
                  ? 'Yes' : 'No'}
              </div>
              <div className="stat-lbl">Bathroom Access</div>
            </div>
          </div>
          <div className="facility-stat">
            <Users size={18} className="stat-icon" />
            <div>
              <div className="stat-val">
                {reviews.filter(r => r.driver_respect_rating).length > 0
                  ? (reviews.filter(r => r.driver_respect_rating).reduce((s, r) => s + r.driver_respect_rating, 0) /
                     reviews.filter(r => r.driver_respect_rating).length).toFixed(1)
                  : '—'}
              </div>
              <div className="stat-lbl">Driver Respect</div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD REVIEW BUTTON */}
      <div className="review-action-bar">
        <h2 className="reviews-title">
          Driver Reviews <span className="review-count-badge">{reviews.length}</span>
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!user) { navigate('/login'); return; }
            setShowForm(!showForm)
          }}
        >
          <Plus size={16} />
          {showForm ? 'Cancel' : 'Add Review'}
        </button>
      </div>

      {/* REVIEW FORM */}
      {showForm && (
        <div className="review-form card">
          <h3 className="form-title">Your Review</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Overall Rating *</label>
                <StarPicker value={form.overall_rating} onChange={v => setForm(f => ({ ...f, overall_rating: v }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Driver Respect</label>
                <StarPicker value={form.driver_respect_rating} onChange={v => setForm(f => ({ ...f, driver_respect_rating: v }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Wait Time (minutes)</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 90"
                value={form.wait_time_minutes}
                onChange={e => setForm(f => ({ ...f, wait_time_minutes: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Detention Pay Honored?</label>
              <BoolToggle value={form.detention_honored} onChange={v => setForm(f => ({ ...f, detention_honored: v }))} labelYes="Yes" labelNo="No" />
            </div>

            <div className="form-group">
              <label className="form-label">Lumper Required?</label>
              <BoolToggle value={form.lumper_required} onChange={v => setForm(f => ({ ...f, lumper_required: v }))} labelYes="Yes" labelNo="No" />
            </div>

            {form.lumper_required && (
              <div className="form-group">
                <label className="form-label">Lumper Cost ($)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 150"
                  value={form.lumper_cost}
                  onChange={e => setForm(f => ({ ...f, lumper_cost: e.target.value }))}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Bathroom Access?</label>
              <BoolToggle value={form.bathroom_access} onChange={v => setForm(f => ({ ...f, bathroom_access: v }))} labelYes="Yes" labelNo="No" />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-input"
                placeholder="What do other drivers need to know? Gate process, dock hours, attitude of staff..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Photos (optional)</label>
              <label className="photo-upload-btn">
                <Camera size={16} />
                {uploading ? 'Uploading...' : `Add Photos ${photos.length > 0 ? `(${photos.length})` : ''}`}
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              {photos.length > 0 && (
                <div className="photo-previews">
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="dock" className="photo-thumb" />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* REVIEWS LIST */}
      {reviews.length === 0 ? (
        <div className="empty-state">
          <Star size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No reviews yet</h3>
          <p>Be the first warrior to review this dock.</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review.id} className="review-card card">
              <div className="review-card-top">
                <div>
                  <div className="reviewer-name">{review.driver_name || 'Anonymous Driver'}</div>
                  <StarDisplay rating={review.overall_rating} size={14} />
                </div>
                <div className="review-date">
                  {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div className="review-badges">
                {review.wait_time_minutes && (
                  <span className="stat-chip">
                    <Clock size={12} />
                    <strong>{review.wait_time_minutes} min</strong> wait
                  </span>
                )}
                {review.detention_honored !== null && (
                  <span className={`badge ${review.detention_honored ? 'badge-green' : 'badge-red'}`}>
                    {review.detention_honored ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    Detention {review.detention_honored ? 'paid' : 'denied'}
                  </span>
                )}
                {review.lumper_required !== null && (
                  <span className={`badge ${review.lumper_required ? 'badge-yellow' : 'badge-gray'}`}>
                    Lumper {review.lumper_required ? `required${review.lumper_cost ? ` $${review.lumper_cost}` : ''}` : 'not required'}
                  </span>
                )}
                {review.bathroom_access !== null && (
                  <span className={`badge ${review.bathroom_access ? 'badge-green' : 'badge-red'}`}>
                    {review.bathroom_access ? '✓' : '✗'} Bathroom
                  </span>
                )}
              </div>

              {review.notes && <p className="review-notes">"{review.notes}"</p>}

              {review.photos && review.photos.length > 0 && (
                <div className="photo-previews">
                  {review.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="dock" className="photo-thumb" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
