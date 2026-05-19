import { useState, useEffect, useRef } from 'react'
import { MapPin, Phone, Wrench, Truck, AlertTriangle, Search, Navigation, Star, Clock, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import './EmergencyServices.css'

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_KEY

const SERVICE_TYPES = [
  { id: 'truck_repair', label: 'Truck Repair', icon: <Wrench size={18} />, query: 'semi truck diesel repair shop', color: 'var(--orange)', emoji: '🔧' },
  { id: 'tire', label: 'Tire Shop', icon: <Truck size={18} />, query: 'commercial truck tire shop 24 hour', color: 'var(--yellow)', emoji: '🛞' },
  { id: 'towing', label: 'Towing', icon: <Truck size={18} />, query: 'semi truck towing heavy towing', color: 'var(--red)', emoji: '🚛' },
  { id: 'hospital', label: 'Hospital / ER', icon: <AlertTriangle size={18} />, query: 'emergency room hospital', color: 'var(--red)', emoji: '🏥' },
  { id: 'fuel', label: '24hr Fuel', icon: <MapPin size={18} />, query: 'truck stop diesel fuel 24 hour', color: 'var(--green)', emoji: '⛽' },
  { id: 'parts', label: 'Truck Parts', icon: <Wrench size={18} />, query: 'semi truck parts store', color: 'var(--blue)', emoji: '🔩' },
]

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

function getDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function EmergencyServices() {
  const [location, setLocation] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [manualSearch, setManualSearch] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocompleteRef = useRef(null)
  const placesRef = useRef(null)

  useEffect(() => {
    loadGoogleMaps(GOOGLE_API_KEY).then(() => {
      if (window.google) {
        autocompleteRef.current = new window.google.maps.places.AutocompleteService()
        const mapDiv = document.createElement('div')
        placesRef.current = new window.google.maps.places.PlacesService(mapDiv)
      }
    })
  }, [])

  const handleGeolocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(coords)
        // Reverse geocode
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: coords }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setLocationName(results[0].formatted_address)
          }
        })
        setLocating(false)
        toast.success('Location found')
      },
      () => { toast.error('Could not get location. Enter manually.'); setLocating(false) }
    )
  }

  const handleManualChange = (val) => {
    setManualSearch(val)
    if (val.length > 2 && autocompleteRef.current) {
      autocompleteRef.current.getPlacePredictions(
        { input: val, types: ['geocode'] },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 4))
            setShowSuggestions(true)
          }
        }
      )
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false)
    setManualSearch(suggestion.description)
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        setLocation({ lat: loc.lat(), lng: loc.lng() })
        setLocationName(suggestion.description)
      }
    })
  }

  const searchServices = async (type) => {
    if (!location) { toast.error('Set your location first'); return }
    setSelectedType(type)
    setLoading(true)
    setResults([])

    try {
      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: 80467, // 50 miles
        query: type.query
      }

      placesRef.current.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const enriched = results
            .slice(0, 10)
            .map(r => ({
              id: r.place_id,
              name: r.name,
              address: r.formatted_address,
              phone: r.formatted_phone_number,
              rating: r.rating,
              total_ratings: r.user_ratings_total,
              open_now: r.opening_hours?.open_now,
              lat: r.geometry.location.lat(),
              lng: r.geometry.location.lng(),
              distance: getDistanceMiles(location.lat, location.lng, r.geometry.location.lat(), r.geometry.location.lng())
            }))
            .sort((a, b) => a.distance - b.distance)
          setResults(enriched)
        } else {
          toast.error('No results found. Try a different location.')
        }
        setLoading(false)
      })
    } catch (err) {
      toast.error('Search failed')
      setLoading(false)
    }
  }

  const getDirections = (place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`
    window.open(url, '_blank')
  }

  const callPhone = (phone) => {
    window.location.href = `tel:${phone.replace(/\D/g, '')}`
  }

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><AlertTriangle size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Emergency Services</h2>
        <p>Broke down on I-70 at 2am? Find the nearest truck repair, tire shop, towing, and more instantly.</p>
      </div>

      {/* LOCATION */}
      <div className="card emergency-location">
        <h3 className="emergency-section-title"><MapPin size={18} /> Your Location</h3>
        <div className="location-row">
          <button
            className="btn btn-primary"
            onClick={handleGeolocate}
            disabled={locating}
          >
            <Navigation size={16} />
            {locating ? 'Finding...' : 'Use My Location'}
          </button>
          <span className="location-or">or</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              className="form-input"
              placeholder="Enter your location or nearest city..."
              value={manualSearch}
              onChange={e => handleManualChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="emergency-suggestions">
                {suggestions.map(s => (
                  <div key={s.place_id} className="emergency-suggestion" onClick={() => handleSuggestionClick(s)}>
                    <MapPin size={12} /> {s.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {locationName && (
          <div className="location-set">
            <MapPin size={14} style={{ color: 'var(--green)' }} />
            <span>Location set: <strong>{locationName}</strong></span>
          </div>
        )}
      </div>

      {/* SERVICE TYPE BUTTONS */}
      <div className="emergency-types">
        {SERVICE_TYPES.map(type => (
          <button
            key={type.id}
            className={`emergency-type-btn ${selectedType?.id === type.id ? 'active' : ''}`}
            style={{ '--type-color': type.color }}
            onClick={() => searchServices(type)}
            disabled={!location}
          >
            <span className="type-emoji">{type.emoji}</span>
            <span className="type-label">{type.label}</span>
          </button>
        ))}
      </div>

      {!location && (
        <div className="emergency-prompt">
          <Navigation size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>Set your location first</h3>
          <p>Tap "Use My Location" or enter your location above, then select the service you need.</p>
        </div>
      )}

      {/* RESULTS */}
      {loading && (
        <div className="loading-spinner"><div className="spinner" />Searching nearby...</div>
      )}

      {!loading && results.length > 0 && selectedType && (
        <div className="emergency-results">
          <h3 className="results-title">
            {selectedType.emoji} {selectedType.label} Near You
            <span className="results-count">{results.length} found</span>
          </h3>
          <div className="results-list">
            {results.map(place => (
              <div key={place.id} className="emergency-result card">
                <div className="result-top">
                  <div className="result-info">
                    <div className="result-name">{place.name}</div>
                    <div className="result-address">{place.address}</div>
                    <div className="result-meta">
                      {place.rating && (
                        <span className="result-rating">
                          <Star size={12} style={{ color: 'var(--yellow)' }} />
                          {place.rating.toFixed(1)}
                          {place.total_ratings && <span style={{ color: 'var(--text-muted)' }}> ({place.total_ratings.toLocaleString()})</span>}
                        </span>
                      )}
                      {place.open_now !== undefined && (
                        <span className={`badge ${place.open_now ? 'badge-green' : 'badge-red'}`}>
                          <Clock size={10} /> {place.open_now ? 'Open Now' : 'Closed'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="result-distance">
                    <div className="distance-value">{place.distance.toFixed(1)}</div>
                    <div className="distance-unit">miles</div>
                  </div>
                </div>
                <div className="result-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => getDirections(place)}>
                    <Navigation size={14} /> Directions
                  </button>
                  {place.phone && (
                    <button className="btn btn-secondary btn-sm" onClick={() => callPhone(place.phone)}>
                      <Phone size={14} /> {place.phone}
                    </button>
                  )}
                  <a
                    href={`https://www.google.com/maps/place/?q=place_id:${place.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <ExternalLink size={14} /> Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK EMERGENCY NUMBERS */}
      <div className="card emergency-numbers">
        <h3 className="emergency-section-title"><Phone size={18} /> Quick Emergency Numbers</h3>
        <div className="quick-numbers">
          {[
            { label: 'Emergency', number: '911', color: 'var(--red)' },
            { label: 'FMCSA Safety', number: '1-888-368-7238', color: 'var(--orange)' },
            { label: 'NTI Truck Assist', number: '1-800-323-4654', color: 'var(--blue)' },
            { label: 'Road Assist (AAA)', number: '1-800-222-4357', color: 'var(--yellow)' },
          ].map(n => (
            <a key={n.label} href={`tel:${n.number.replace(/\D/g,'')}`} className="quick-number-btn" style={{ '--num-color': n.color }}>
              <Phone size={16} />
              <div>
                <div className="qn-label">{n.label}</div>
                <div className="qn-number">{n.number}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
