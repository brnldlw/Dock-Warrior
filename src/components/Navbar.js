import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield, Search, Clock, User, LogOut, Menu, X, Trophy, Star, DollarSign, Plus, FileText, Navigation, Fuel, Calculator, MessageSquare, AlertTriangle, ChevronDown, Mail, Gift } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import './Navbar.css'

function Dropdown({ label, icon, items, isActive }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="nav-dropdown" ref={ref}>
      <button className={`nav-link nav-dropdown-trigger ${isActive ? 'active' : ''}`} onClick={() => setOpen(!open)}>
        {icon} {label} <ChevronDown size={12} className={`dropdown-arrow ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {items.map((item, i) => (
            <Link key={i} to={item.to} className="dropdown-item" onClick={() => setOpen(false)}>
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const p = location.pathname

  const intelligenceItems = [
    { to: '/search', icon: <Search size={14} />, label: 'Search Docks' },
    { to: '/truck-stops', icon: <Fuel size={14} />, label: 'Truck Stops' },
    { to: '/brokers', icon: <Star size={14} />, label: 'Broker Ratings' },
    { to: '/leaderboard', icon: <Trophy size={14} />, label: 'Leaderboard' },
    { to: '/route', icon: <Navigation size={14} />, label: 'Route Intelligence' },
    { to: '/feed', icon: <MessageSquare size={14} />, label: 'Driver Feed' },
  ]

  const toolItems = [
    { to: '/timer', icon: <Clock size={14} />, label: 'Detention Timer' },
    { to: '/invoice', icon: <FileText size={14} />, label: 'Detention Invoice' },
    { to: '/calculator', icon: <Calculator size={14} />, label: 'Load Calculator' },
    { to: '/safety', icon: <Shield size={14} />, label: 'Safety Check-In' },
    { to: '/emergency', icon: <AlertTriangle size={14} />, label: 'Emergency Services' },
    { to: '/add-facility', icon: <Plus size={14} />, label: 'Add a Dock' },
    { to: '/contact', icon: <Mail size={14} />, label: 'Contact Us' },
    { to: '/warrior', icon: <span>⚔</span>, label: 'The Warrior AI' },
    { to: '/referral', icon: <Gift size={14} />, label: 'Refer a Driver' },
  ]

  const intelligenceActive = ['/search','/truck-stops','/brokers','/leaderboard','/route','/feed'].includes(p)
  const toolsActive = ['/timer','/invoice','/calculator','/safety','/emergency','/add-facility','/warrior'].includes(p)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <Shield size={24} className="brand-icon" />
          <span className="brand-text">DOCK<span className="brand-accent">WARRIOR</span></span>
        </Link>

        {/* Hamburger - moved before links for proper stacking */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile overlay */}
        {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <div className="desktop-nav">
            <Dropdown label="Intelligence" icon={<Search size={16} />} items={intelligenceItems} isActive={intelligenceActive} />
            <Dropdown label="Tools" icon={<Clock size={16} />} items={toolItems} isActive={toolsActive} />
            <Link to="/warrior" className={`nav-link nav-warrior ${p === '/warrior' ? 'active' : ''}`}>
              ⚔ The Warrior
            </Link>
            <Link to="/pricing" className={`nav-link nav-pro ${p === '/pricing' ? 'active' : ''}`}>
              <DollarSign size={16} /> Go Pro
            </Link>
            {user ? (
              <>
                <Link to="/profile" className={`nav-link ${p === '/profile' ? 'active' : ''}`}>
                  <User size={16} /> Profile
                </Link>
                <button className="nav-link nav-signout" onClick={handleSignOut}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
            )}
          </div>

          <div className="mobile-nav">
            <div className="mobile-nav-section-label">Intelligence</div>
            {intelligenceItems.map(item => (
              <Link key={item.to} to={item.to} className={`nav-link ${p === item.to ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                {item.icon} {item.label}
              </Link>
            ))}
            <div className="mobile-nav-section-label">Tools</div>
            {toolItems.map(item => (
              <Link key={item.to} to={item.to} className={`nav-link ${p === item.to ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                {item.icon} {item.label}
              </Link>
            ))}
            <div className="mobile-nav-section-label">Account</div>
            <Link to="/pricing" className="nav-link nav-pro" onClick={() => setMenuOpen(false)}>
              <DollarSign size={16} /> Go Pro
            </Link>
            {user ? (
              <>
                <Link to="/profile" className={`nav-link ${p === '/profile' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  <User size={16} /> Profile
                </Link>
                <button className="nav-link nav-signout" onClick={handleSignOut}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm" style={{ margin: '8px 0' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}