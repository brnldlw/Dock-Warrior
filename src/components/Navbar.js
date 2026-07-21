import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIsNativeApp } from '../hooks/useIsNativeApp'
import { Shield, Search, Clock, User, LogOut, Menu, X, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isNative = useIsNativeApp()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const p = location.pathname

  const allLinks = [
    { section: 'Intelligence' },
    { to: '/search', icon: '🔍', label: 'Search Docks' },
    { to: '/truck-stops', icon: '⛽', label: 'Truck Stops' },
    { to: '/brokers', icon: '⭐', label: 'Broker Ratings' },
    { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { to: '/route', icon: '🗺️', label: 'Route Intelligence' },
    { to: '/feed', icon: '💬', label: 'Driver Feed' },
    { section: 'Tools' },
    { to: '/timer', icon: '⏱️', label: 'Detention Timer' },
    { to: '/invoice', icon: '📄', label: 'Detention Invoice' },
    { to: '/calculator', icon: '🧮', label: 'Load Calculator' },
    { to: '/safety', icon: '🛡️', label: 'Safety Check-In' },
    { to: '/emergency', icon: '🚨', label: 'Emergency Services' },
    { to: '/warrior', icon: '⚔️', label: 'The Warrior AI' },
    { to: '/add-facility', icon: '➕', label: 'Add a Dock' },
    { to: '/contact', icon: '✉️', label: 'Contact Us' },
    { to: '/referral', icon: '🎁', label: 'Refer a Driver' },
  ]

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <Shield size={24} className="brand-icon" />
            <span className="brand-text">DOCK<span className="brand-accent">WARRIOR</span></span>
          </Link>

          <div className="desktop-nav">
            <div className="desktop-dropdown">
              <button className="nav-link">
                <Search size={14} /> Intelligence
              </button>
              <div className="desktop-dropdown-menu">
                {['/search','/truck-stops','/brokers','/leaderboard','/route','/feed'].map((to, i) => (
                  <Link key={to} to={to} className="dropdown-item">
                    {['Search Docks','Truck Stops','Broker Ratings','Leaderboard','Route Intelligence','Driver Feed'][i]}
                  </Link>
                ))}
              </div>
            </div>
            <div className="desktop-dropdown">
              <button className="nav-link">
                <Clock size={14} /> Tools
              </button>
              <div className="desktop-dropdown-menu">
                {['/timer','/invoice','/calculator','/safety','/emergency','/add-facility','/contact','/warrior','/referral'].map((to, i) => (
                  <Link key={to} to={to} className="dropdown-item">
                    {['Detention Timer','Detention Invoice','Load Calculator','Safety Check-In','Emergency Services','Add a Dock','Contact Us','The Warrior AI','Refer a Driver'][i]}
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/warrior" className="nav-link nav-warrior">⚔ The Warrior</Link>
            {!isNative && (
              <Link to="/pricing" className="nav-link nav-pro">
                <DollarSign size={14} /> Go Pro
              </Link>
            )}
            {user ? (
              <>
                <Link to="/profile" className="nav-link"><User size={14} /> Profile</Link>
                <button className="nav-link nav-signout" onClick={handleSignOut}><LogOut size={14} /> Sign Out</button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
            )}
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          background: '#0d0d0d', overflowY: 'auto', paddingTop: '64px'
        }}>
          <div style={{ padding: '16px' }}>
            {allLinks.map((item, i) => {
              if (item.section) {
                return (
                  <div key={i} style={{
                    color: '#FF6B00', fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                    padding: '16px 8px 6px', borderTop: i === 0 ? 'none' : '1px solid #222',
                    marginTop: i === 0 ? 0 : 8
                  }}>
                    {item.section}
                  </div>
                )
              }
              return (
                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px',
                  color: p === item.to ? '#FF6B00' : '#ccc', textDecoration: 'none',
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
                  letterSpacing: 1, textTransform: 'uppercase', borderRadius: 8,
                  background: p === item.to ? 'rgba(255,107,0,0.1)' : 'transparent', marginBottom: 2
                }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}

            {!isNative && (
              <Link to="/pricing" onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px',
                color: '#FF6B00', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)',
                textDecoration: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16,
                fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', borderRadius: 8,
                display: 'block', marginBottom: 2, marginTop: 8
              }}>
                💰 Go Pro
              </Link>
            )}

            {user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px',
                  color: '#ccc', textDecoration: 'none', fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                  borderRadius: 8, marginBottom: 2
                }}>
                  <span style={{ fontSize: 18 }}>👤</span> Profile
                </Link>
                <button onClick={handleSignOut} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px',
                  color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700,
                  letterSpacing: 1, textTransform: 'uppercase', borderRadius: 8, width: '100%'
                }}>
                  <span style={{ fontSize: 18 }}>🚪</span> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                display: 'block', margin: '16px 0', padding: '14px',
                background: '#FF6B00', color: '#fff', textAlign: 'center',
                textDecoration: 'none', fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 16, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
                borderRadius: 8
              }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}