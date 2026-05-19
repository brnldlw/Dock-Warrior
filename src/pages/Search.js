import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, MapPin, Clock, Star, ChevronRight, Filter, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './Search.css'

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_KEY

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve()
      return
    }
    const existing = document.getElementById('google-maps-script')
    if (existing) {
      existing.addEventListener('load', resolve)
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize: size }} className={`star ${n <= Math.round(rating) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  )
}

function FacilityCard({ facility }) {
  const rating = facility.avg_rating || 0
  const reviewCount = facility.review_count || 0
  const avgWait = facility.avg_wait ? `${Math.round(facility.avg_wait)} min` : 'No data'
  const detentionRate = facility.detention_rate != null
    ? `${Math.round(facility.detention_rate * 100)}%`
    : 'No data'

  return (
    <Link to={`/facility/${facility.id}`} className="facility-card card card-clickable">
      <div className="facility-card-top">
        <div className="facility-info">
          <h3 className="facility-name">{facility.name}</h3>
          <div className="facility-address">
            <MapPin size={13} />
            {facility.city}, {facility.state}
          </div>
        </div>
        <div className="facility-rating">
          {rating > 0 ? (
            <>
              <div className="rating-number">{rating.toFixed(1)}</div>
              <StarDisplay rating={rating} />
              <div className="review-count">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</div>
            </>
          ) : (
            <div className="no-rating">No reviews yet</div>
          )}
        </div>
      </div>

      <div className="divider" style={{ margin: '14px 0' }} />

      <div className="stat-row">
        <span className="stat-chip">
          <Clock size={13} />
          Avg wait <strong>{avgWait}</strong>
        </span>
        <span className={`badge ${
          facility.detention_rate == null ? 'badge-gray' :
          facility.detention_rate >= 0.6 ? 'badge-green' :
          facility.detention_rate >= 0.3 ? 'badge-yellow' : 'badge-red'
        }`}>
          {facility.detention_rate == null ? 'Detention unknown' :
           facility.detention_rate >= 0.6 ? `✓ Pays detention ${detentionRate}` :
           facility.detention_rate >= 0.3 ? `~ Detention ${detentionRate}` :
           `✗ Detention ${detentionRate}`}
        </span>
        <span className="badge badge-gray">{facility.facility_type}</span>
      </div>

      <div className="facility-card-arrow">
        <ChevronRight size={18} />
      </div>
    </Link>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocompleteService = useRef(null)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    loadGoogleMapsScript(GOOGLE_API_KEY).then(() => {
      if (window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
      }
    }).catch(() => {
      console.warn('Google Maps failed to load — using text search only')
    })

    // Load all facilities on mount
    fetchFacilities('')
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchFacilities = async (searchTerm, type = 'all') => {
    setLoading(true)
    try {
      let q = supabase
        .from('facilities')
        .select(`
          *,
          reviews(overall_rating, wait_time_minutes, detention_honored)
        `)

      if (searchTerm) {
        q = q.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
      }

      if (type !== 'all') {
        q = q.or(`facility_type.eq.${type},facility_type.eq.both`)
      }

      const { data, error } = await q.limit(500)
      if (error) throw error

      // Compute aggregates client-side
      const enriched = (data || []).map(f => {
        const reviews = f.reviews || []
        const avg_rating = reviews.length > 0
          ? reviews.reduce((s, r) => s + (r.overall_rating || 0), 0) / reviews.length
          : null
        const avg_wait = reviews.filter(r => r.wait_time_minutes).length > 0
          ? reviews.filter(r => r.wait_time_minutes).reduce((s, r) => s + r.wait_time_minutes, 0) /
            reviews.filter(r => r.wait_time_minutes).length
          : null
        const detention_reviews = reviews.filter(r => r.detention_honored !== null)
        const detention_rate = detention_reviews.length > 0
          ? detention_reviews.filter(r => r.detention_honored).length / detention_reviews.length
          : null

        return {
          ...f,
          avg_rating,
          avg_wait,
          detention_rate,
          review_count: reviews.length
        }
      })

      setFacilities(enriched)
      setSearched(true)
    } catch (err) {
      toast.error('Search failed. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)

    if (val.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        { input: val, types: ['establishment', 'geocode'] },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5))
            setShowSuggestions(true)
          } else {
            setSuggestions([])
          }
        }
      )
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.description)
    setShowSuggestions(false)
    fetchFacilities(suggestion.description, filterType)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    fetchFacilities(query, filterType)
  }

  const handleFilterChange = (type) => {
    setFilterType(type)
    fetchFacilities(query, type)
  }

  return (
    <div className="page">
      <div className="search-header section-header">
        <div className="accent-line" />
        <h2>Search Docks</h2>
        <p>Find any shipper or receiver. Get the real story before you arrive.</p>
      </div>

      {/* SEARCH BAR */}
      <div className="search-bar-wrapper">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrap" ref={inputRef}>
            <Search size={20} className="search-icon-input" />
            <input
              className="search-input"
              type="text"
              placeholder="Search facility name, city, or state..."
              value={query}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="autocomplete-dropdown" ref={suggestionsRef}>
                {suggestions.map((s) => (
                  <div
                    key={s.place_id}
                    className="autocomplete-item"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    <MapPin size={14} />
                    <span>{s.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {/* FILTERS */}
        <div className="search-filters">
          <Filter size={14} />
          <div className="toggle-group">
            {['all', 'receiver', 'shipper'].map(t => (
              <button
                key={t}
                className={`toggle-pill ${filterType === t ? 'active' : ''}`}
                onClick={() => handleFilterChange(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" /> Searching...
        </div>
      ) : searched && facilities.length === 0 ? (
        <div className="empty-state">
          <MapPin size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No facilities found</h3>
          <p>Try a different search term, or be the first to add this facility.</p>
        </div>
      ) : (
        <div className="results-list">
          {facilities.length > 0 && (
            <div className="results-count">{facilities.length} facilit{facilities.length !== 1 ? 'ies' : 'y'} found</div>
          )}
          {facilities.map(f => (
            <FacilityCard key={f.id} facility={f} />
          ))}
        </div>
      )}
    </div>
  )
}
