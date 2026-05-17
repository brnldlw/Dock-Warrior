import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Trophy, Clock, ChevronRight, AlertTriangle, Star, TrendingUp } from 'lucide-react'
import './Leaderboard.css'

function FacilityRow({ rank, facility, metric, metricLabel, metricColor }) {
  return (
    <Link to={`/facility/${facility.id}`} className="lb-row card card-clickable">
      <div className={`lb-rank ${rank <= 3 ? 'lb-rank-top' : ''}`}>#{rank}</div>
      <div className="lb-info">
        <div className="lb-name">{facility.name}</div>
        <div className="lb-location">{facility.city}, {facility.state}</div>
        <div className="lb-review-count">{facility.review_count} review{facility.review_count !== 1 ? 's' : ''}</div>
      </div>
      <div className="lb-metric" style={{ color: metricColor }}>
        <div className="lb-metric-value">{metric}</div>
        <div className="lb-metric-label">{metricLabel}</div>
      </div>
      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
    </Link>
  )
}

export default function Leaderboard() {
  const [tab, setTab] = useState('worst')
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('facilities')
      .select('*, reviews(overall_rating, wait_time_minutes, detention_honored)')

    if (data) {
      const enriched = data.map(f => {
        const reviews = f.reviews || []
        const avg_rating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length : null
        const avg_wait = reviews.filter(r => r.wait_time_minutes).length > 0
          ? reviews.filter(r => r.wait_time_minutes).reduce((s, r) => s + r.wait_time_minutes, 0) / reviews.filter(r => r.wait_time_minutes).length
          : null
        const detention_reviews = reviews.filter(r => r.detention_honored !== null)
        const detention_rate = detention_reviews.length > 0
          ? detention_reviews.filter(r => r.detention_honored).length / detention_reviews.length
          : null
        return { ...f, avg_rating, avg_wait, detention_rate, review_count: reviews.length }
      }).filter(f => f.review_count > 0)

      setFacilities(enriched)
    }
    setLoading(false)
  }

  const getList = () => {
    switch (tab) {
      case 'worst':
        return [...facilities]
          .filter(f => f.avg_rating !== null)
          .sort((a, b) => a.avg_rating - b.avg_rating)
          .slice(0, 15)
      case 'wait':
        return [...facilities]
          .filter(f => f.avg_wait !== null)
          .sort((a, b) => b.avg_wait - a.avg_wait)
          .slice(0, 15)
      case 'detention':
        return [...facilities]
          .filter(f => f.detention_rate !== null)
          .sort((a, b) => a.detention_rate - b.detention_rate)
          .slice(0, 15)
      case 'most':
        return [...facilities]
          .sort((a, b) => b.review_count - a.review_count)
          .slice(0, 15)
      default:
        return []
    }
  }

  const getMetric = (f) => {
    switch (tab) {
      case 'worst':
        return { value: `${f.avg_rating?.toFixed(1)} ★`, label: 'avg rating', color: 'var(--red)' }
      case 'wait':
        return { value: `${Math.round(f.avg_wait)} min`, label: 'avg wait', color: 'var(--yellow)' }
      case 'detention':
        return { value: `${Math.round((f.detention_rate || 0) * 100)}%`, label: 'detention paid', color: 'var(--red)' }
      case 'most':
        return { value: f.review_count, label: 'reviews', color: 'var(--orange)' }
      default:
        return { value: '', label: '', color: '' }
    }
  }

  const list = getList()

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Trophy size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Leaderboard</h2>
        <p>The definitive ranking of America's docks — by drivers who've been there.</p>
      </div>

      {/* TABS */}
      <div className="lb-tabs">
        <button className={`lb-tab ${tab === 'worst' ? 'active' : ''}`} onClick={() => setTab('worst')}>
          <AlertTriangle size={15} /> Worst Rated
        </button>
        <button className={`lb-tab ${tab === 'wait' ? 'active' : ''}`} onClick={() => setTab('wait')}>
          <Clock size={15} /> Longest Waits
        </button>
        <button className={`lb-tab ${tab === 'detention' ? 'active' : ''}`} onClick={() => setTab('detention')}>
          <Star size={15} /> Detention Denied
        </button>
        <button className={`lb-tab ${tab === 'most' ? 'active' : ''}`} onClick={() => setTab('most')}>
          <TrendingUp size={15} /> Most Reviewed
        </button>
      </div>

      {/* DISCLAIMER */}
      <div className="lb-disclaimer">
        <AlertTriangle size={14} />
        Rankings based on verified driver reviews. Updated in real time as reviews are submitted.
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" />Loading rankings...</div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>Not enough data yet</h3>
          <p>Be the first to review a facility and start building the leaderboard.</p>
          <Link to="/search" className="btn btn-primary" style={{ marginTop: 20 }}>Search Docks</Link>
        </div>
      ) : (
        <div className="lb-list">
          {list.map((f, i) => {
            const m = getMetric(f)
            return (
              <FacilityRow
                key={f.id}
                rank={i + 1}
                facility={f}
                metric={m.value}
                metricLabel={m.label}
                metricColor={m.color}
              />
            )
          })}
        </div>
      )}

      <div className="lb-footer">
        <p>Don't see a facility? <Link to="/search" className="lb-link">Search and add it.</Link></p>
      </div>
    </div>
  )
}
