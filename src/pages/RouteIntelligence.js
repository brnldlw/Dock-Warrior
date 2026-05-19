import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useSubscription } from '../hooks/useSubscription'
import { Link } from 'react-router-dom'
import { MapPin, Navigation, AlertTriangle, CheckCircle, Clock, Star, Fuel, ChevronRight, Zap, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import './RouteIntelligence.css'

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_KEY

function loadGoogleMaps(key) {
  return new Promise(resolve => {
    if (window.google?.maps) { resolve(); return }
    const existing = document.getElementById('google-maps-script')
    if (existing) { existing.addEventListener('load', resolve); return }
    const s = document.createElement('script')
    s.id = 'google-maps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry`
    s.async = true
    s.onload = resolve
    document.head.appendChild(s)
  })
}

function RiskBadge({ rating }) {
  if (!rating) return <span className="badge badge-gray">No data</span>
  if (rating <= 2) return <span className="badge badge-red">⚠ High Risk</span>
  if (rating <= 3) return <span className="badge badge-yellow">~ Moderate</span>
  return <span className="badge badge-green">✓ Good</span>
}

export default function RouteIntelligence() {
  const { isPro } = useSubscription()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [routeData, setRouteData] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [truckStops, setTruckStops] = useState([])
  const [originSuggestions, setOriginSuggestions] = useState([])
  const [destSuggestions, setDestSuggestions] = useState([])
  const [showOriginSugg, setShowOriginSugg] = useState(false)
  const [showDestSugg, setShowDestSugg] = useState(false)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    loadGoogleMaps(GOOGLE_API_KEY).then(() => {
      if (window.google) {
        autocompleteRef.current = new window.google.maps.places.AutocompleteService()
      }
    })
  }, [])

  const getSuggestions = (value, setter, showSetter) => {
    if (value.length < 3 || !autocompleteRef.current) { setter([]); return }
    autocompleteRef.current.getPlacePredictions(
      { input: value, types: ['geocode'] },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setter(predictions.slice(0, 4))
          showSetter(true)
        }
      }
    )
  }

  const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location
          resolve({ lat: loc.lat(), lng: loc.lng() })
        } else {
          reject(new Error('Could not geocode: ' + address))
        }
      })
    })
  }

  const getRoute = (originCoords, destCoords) => {
    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DirectionsService()
      service.route({
        origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
        destination: new window.google.maps.LatLng(destCoords.lat, destCoords.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') resolve(result)
        else reject(new Error('Route not found'))
      })
    })
  }

  const isNearRoute = (point, routePath, thresholdMiles = 30) => {
    const thresholdMeters = thresholdMiles * 1609.34
    for (let i = 0; i < routePath.length; i++) {
      const routePoint = routePath[i]
      const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(point.lat, point.lng),
        routePoint
      )
      if (dist <= thresholdMeters) return true
    }
    return false
  }

  const handleSearch = async () => {
    if (!origin.trim() || !destination.trim()) { toast.error('Enter origin and destination'); return }
    if (!isPro) { toast.error('Route Intelligence is a Pro feature'); return }
    setLoading(true)
    setRouteData(null)
    setFacilities([])
    setTruckStops([])

    try {
      await loadGoogleMaps(GOOGLE_API_KEY)
      const [originCoords, destCoords] = await Promise.all([
        geocodeAddress(origin),
        geocodeAddress(destination)
      ])

      const route = await getRoute(originCoords, destCoords)
      const leg = route.routes[0].legs[0]
      const routePath = route.routes[0].overview_path

      const distance = leg.distance.text
      const duration = leg.duration.text

      setRouteData({ origin, destination, distance, duration, originCoords, destCoords })

      // Fetch all facilities and truck stops
      const [facResult, stopResult] = await Promise.all([
        supabase.from('facilities').select('*, reviews(overall_rating, wait_time_minutes, detention_honored)'),
        supabase.from('truck_stops').select('*, truck_stop_reviews(overall_rating, parking_spaces_available)')
      ])

      // Filter to those near route
      const nearFacilities = (facResult.data || [])
        .filter(f => f.lat && f.lng && isNearRoute({ lat: f.lat, lng: f.lng }, routePath, 25))
        .map(f => {
          const reviews = f.reviews || []
          const avg_rating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length : null
          const avg_wait = reviews.filter(r => r.wait_time_minutes).length > 0
            ? reviews.filter(r => r.wait_time_minutes).reduce((s, r) => s + r.wait_time_minutes, 0) / reviews.filter(r => r.wait_time_minutes).length : null
          const det_reviews = reviews.filter(r => r.detention_honored !== null)
          const detention_rate = det_reviews.length > 0 ? det_reviews.filter(r => r.detention_honored).length / det_reviews.length : null
          return { ...f, avg_rating, avg_wait, detention_rate, review_count: reviews.length }
        })
        .sort((a, b) => (a.avg_rating || 5) - (b.avg_rating || 5))

      const nearStops = (stopResult.data || [])
        .filter(s => s.lat && s.lng && isNearRoute({ lat: s.lat, lng: s.lng }, routePath, 25))
        .map(s => {
          const reviews = s.truck_stop_reviews || []
          const avg_rating = reviews.length > 0 ? reviews.reduce((a, b) => a + b.overall_rating, 0) / reviews.length : null
          return { ...s, avg_rating, review_count: reviews.length }
        })

      setFacilities(nearFacilities)
      setTruckStops(nearStops)
      toast.success(`Found ${nearFacilities.length} facilities and ${nearStops.length} truck stops along your route`)
    } catch (err) {
      toast.error(err.message || 'Route search failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const worstDocks = facilities.filter(f => f.avg_rating !== null && f.avg_rating <= 2.5)
  const highDetentionRisk = facilities.filter(f => f.detention_rate !== null && f.detention_rate < 0.3)

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Navigation size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Route Intelligence</h2>
        <p>Enter your route and see every dock and truck stop along the way — with real driver ratings.</p>
      </div>

      {!isPro && (
        <div className="route-pro-banner">
          <Zap size={18} />
          <div><strong>Pro Feature</strong> — Route Intelligence is available to Pro members. See every facility and truck stop on your route before you leave.</div>
          <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade to Pro — $12/mo</Link>
        </div>
      )}

      {/* SEARCH */}
      <div className="card route-search-card">
        <h3 className="route-search-title">Plan Your Route</h3>
        <div className="route-inputs">
          <div className="route-input-wrap">
            <label className="form-label">Origin</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Starting city or address"
                value={origin}
                onChange={e => { setOrigin(e.target.value); getSuggestions(e.target.value, setOriginSuggestions, setShowOriginSugg) }}
                onBlur={() => setTimeout(() => setShowOriginSugg(false), 200)}
              />
              {showOriginSugg && originSuggestions.length > 0 && (
                <div className="route-suggestions">
                  {originSuggestions.map(s => (
                    <div key={s.place_id} className="route-suggestion" onClick={() => { setOrigin(s.description); setShowOriginSugg(false) }}>
                      <MapPin size={12} /> {s.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="route-arrow">→</div>

          <div className="route-input-wrap">
            <label className="form-label">Destination</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--orange)', pointerEvents: 'none' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Destination city or address"
                value={destination}
                onChange={e => { setDestination(e.target.value); getSuggestions(e.target.value, setDestSuggestions, setShowDestSugg) }}
                onBlur={() => setTimeout(() => setShowDestSugg(false), 200)}
              />
              {showDestSugg && destSuggestions.length > 0 && (
                <div className="route-suggestions">
                  {destSuggestions.map(s => (
                    <div key={s.place_id} className="route-suggestion" onClick={() => { setDestination(s.description); setShowDestSugg(false) }}>
                      <MapPin size={12} /> {s.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="btn btn-primary route-search-btn"
            onClick={handleSearch}
            disabled={loading || !isPro}
          >
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />Scanning...</> : <><Search size={16} /> Scan Route</>}
          </button>
        </div>
      </div>

      {/* ROUTE SUMMARY */}
      {routeData && (
        <div className="route-summary">
          <div className="route-summary-main">
            <div className="route-summary-label">Route</div>
            <div className="route-summary-value">{routeData.origin} → {routeData.destination}</div>
          </div>
          <div className="route-summary-stat">
            <div className="route-summary-label">Distance</div>
            <div className="route-summary-value">{routeData.distance}</div>
          </div>
          <div className="route-summary-stat">
            <div className="route-summary-label">Drive Time</div>
            <div className="route-summary-value">{routeData.duration}</div>
          </div>
          <div className="route-summary-stat">
            <div className="route-summary-label">Facilities Found</div>
            <div className="route-summary-value" style={{ color: 'var(--orange)' }}>{facilities.length}</div>
          </div>
          <div className="route-summary-stat">
            <div className="route-summary-label">Truck Stops</div>
            <div className="route-summary-value" style={{ color: 'var(--orange)' }}>{truckStops.length}</div>
          </div>
        </div>
      )}

      {/* ALERTS */}
      {routeData && (worstDocks.length > 0 || highDetentionRisk.length > 0) && (
        <div className="route-alerts">
          <h3 className="route-alerts-title"><AlertTriangle size={18} /> Route Alerts</h3>
          {worstDocks.length > 0 && (
            <div className="route-alert route-alert-red">
              <AlertTriangle size={16} />
              <div>
                <strong>{worstDocks.length} low-rated dock{worstDocks.length > 1 ? 's' : ''} on this route:</strong>
                {' '}{worstDocks.map(d => d.name).join(', ')}
              </div>
            </div>
          )}
          {highDetentionRisk.length > 0 && (
            <div className="route-alert route-alert-yellow">
              <Clock size={16} />
              <div>
                <strong>{highDetentionRisk.length} high detention risk facilit{highDetentionRisk.length > 1 ? 'ies' : 'y'}:</strong>
                {' '}{highDetentionRisk.map(d => d.name).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FACILITIES */}
      {routeData && facilities.length > 0 && (
        <div className="route-section">
          <h3 className="route-section-title">
            <Star size={18} /> Facilities Along Route
            <span className="route-section-count">{facilities.length}</span>
          </h3>
          <div className="route-items">
            {facilities.map(f => (
              <Link key={f.id} to={`/facility/${f.id}`} className="route-item card">
                <div className="route-item-info">
                  <div className="route-item-name">{f.name}</div>
                  <div className="route-item-location">{f.city}, {f.state}</div>
                  <div className="route-item-badges">
                    {f.avg_wait && <span className="stat-chip"><Clock size={11} /><strong>{Math.round(f.avg_wait)}min</strong> avg wait</span>}
                    {f.detention_rate !== null && (
                      <span className={`badge ${f.detention_rate >= 0.6 ? 'badge-green' : f.detention_rate >= 0.3 ? 'badge-yellow' : 'badge-red'}`}>
                        {Math.round(f.detention_rate * 100)}% detention paid
                      </span>
                    )}
                    <RiskBadge rating={f.avg_rating} />
                  </div>
                </div>
                <div className="route-item-rating">
                  {f.avg_rating ? (
                    <>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: 800, color: f.avg_rating <= 2.5 ? 'var(--red)' : f.avg_rating <= 3.5 ? 'var(--yellow)' : 'var(--green)', lineHeight: 1 }}>{f.avg_rating.toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.review_count} reviews</div>
                    </>
                  ) : <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No reviews</div>}
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TRUCK STOPS */}
      {routeData && truckStops.length > 0 && (
        <div className="route-section">
          <h3 className="route-section-title">
            <Fuel size={18} /> Truck Stops Along Route
            <span className="route-section-count">{truckStops.length}</span>
          </h3>
          <div className="route-items">
            {truckStops.map(s => (
              <div key={s.id} className="route-item card">
                <div className="route-item-info">
                  <div className="route-item-name">{s.name}</div>
                  <div className="route-item-location">{s.city}, {s.state}</div>
                  {s.brand && <span className="brand-badge" style={{ background: '#FF6B00', fontSize: 10, padding: '2px 8px' }}>{s.brand}</span>}
                </div>
                <div className="route-item-rating">
                  {s.avg_rating ? (
                    <>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: 24, fontWeight: 800, color: 'var(--orange)', lineHeight: 1 }}>{s.avg_rating.toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.review_count} reviews</div>
                    </>
                  ) : <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No reviews</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {routeData && facilities.length === 0 && truckStops.length === 0 && (
        <div className="empty-state">
          <Navigation size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <h3>No facilities found along this route</h3>
          <p>Try a longer route or check back as more drivers add facilities.</p>
        </div>
      )}

      {!routeData && !loading && (
        <div className="route-placeholder">
          <Navigation size={64} style={{ color: 'var(--text-muted)', marginBottom: 20 }} />
          <h3>Enter a route to get started</h3>
          <p>See every dock and truck stop along your lane — rated by drivers who've been there.</p>
          {!isPro && <Link to="/pricing" className="btn btn-primary" style={{ marginTop: 20 }}>Upgrade to Pro to Use Route Intelligence</Link>}
        </div>
      )}
    </div>
  )
}
