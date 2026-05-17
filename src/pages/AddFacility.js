import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MapPin, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import './AddFacility.css'

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_KEY

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) { resolve(); return }
    const existing = document.getElementById('google-maps-script')
    if (existing) { existing.addEventListener('load', resolve); return }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = resolve
    document.head.appendChild(script)
  })
}

export default function AddFacility() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    facility_type: 'both'
  })
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const autocompleteService = useRef(null)
  const placesService = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadGoogleMapsScript(GOOGLE_API_KEY).then(() => {
      if (window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        const mapDiv = document.createElement('div')
        placesService.current = new window.google.maps.places.PlacesService(mapDiv)
      }
    })
  }, [user])

  const handleAddressChange = (val) => {
    setForm(f => ({ ...f, address: val }))
    if (val.length > 3 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        { input: val, types: ['establishment', 'geocode'] },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5))
            setShowSuggestions(true)
          }
        }
      )
    }
  }

  const handleSuggestionSelect = (suggestion) => {
    setShowSuggestions(false)
    if (!placesService.current) return
    placesService.current.getDetails(
      { placeId: suggestion.place_id, fields: ['name', 'formatted_address', 'address_components', 'geometry'] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) return
        const components = place.address_components || []
        const get = (type) => components.find(c => c.types.includes(type))?.long_name || ''
        const getShort = (type) => components.find(c => c.types.includes(type))?.short_name || ''
        setForm(f => ({
          ...f,
          name: f.name || place.name || '',
          address: `${get('street_number')} ${get('route')}`.trim() || place.formatted_address,
          city: get('locality') || get('sublocality') || '',
          state: getShort('administrative_area_level_1'),
          zip: get('postal_code'),
        }))
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Enter facility name'); return }
    if (!form.address.trim()) { toast.error('Enter address'); return }
    if (!form.city.trim() || !form.state.trim()) { toast.error('Enter city and state'); return }
    setSubmitting(true)
    try {
      const { data, error } = await supabase.from('facilities').insert({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim() || null,
        facility_type: form.facility_type
      }).select().single()
      if (error) throw error
      toast.success('Facility added! Leave the first review.')
      navigate(`/facility/${data.id}`)
    } catch (err) {
      if (err.code === '23505') {
        toast.error('This facility already exists. Search for it.')
      } else {
        toast.error('Failed to add facility')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Plus size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Add a Facility</h2>
        <p>Don't see a dock in our system? Add it and be the first to review it.</p>
      </div>

      <div className="add-facility-layout">
        <div className="card add-facility-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Facility Name *</label>
              <input className="form-input" placeholder="e.g. Amazon Fulfillment Center MDW2" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Street Address *</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  placeholder="Start typing address..."
                  value={form.address}
                  onChange={e => handleAddressChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="af-suggestions">
                    {suggestions.map(s => (
                      <div key={s.place_id} className="af-suggestion" onClick={() => handleSuggestionSelect(s)}>
                        <MapPin size={13} /> {s.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input className="form-input" placeholder="IL" maxLength={2} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase() }))} />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP</label>
                <input className="form-input" placeholder="60601" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Facility Type</label>
              <div className="toggle-group">
                {['shipper', 'receiver', 'both'].map(t => (
                  <button key={t} type="button" className={`toggle-pill ${form.facility_type === t ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, facility_type: t }))}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Facility & Leave Review'}
            </button>
          </form>
        </div>

        <div className="af-sidebar">
          <div className="card">
            <h4 className="af-sidebar-title">Before You Add</h4>
            <ul className="af-tips">
              <li>Search first to make sure it's not already in the system</li>
              <li>Use the official facility name from the rate confirmation</li>
              <li>Include the full street address so other drivers can find it</li>
              <li>After adding, you'll go straight to the review page</li>
            </ul>
            <a href="/search" className="btn btn-secondary btn-sm" style={{ marginTop: 16, display: 'inline-flex' }}>
              <Search size={14} /> Search First
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
