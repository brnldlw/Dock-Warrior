import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield, Search, Clock, User, LogOut, Menu, X, Trophy, Star, DollarSign, Plus, FileText, Navigation, Fuel, Calculator } from 'lucide-react'
import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <Shield size={24} className="brand-icon" />
          <span className="brand-text">DOCK<span className="brand-accent">WARRIOR</span></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Search size={16} /> Docks
          </Link>
          <Link to="/truck-stops" className={`nav-link ${isActive('/truck-stops') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Fuel size={16} /> Truck Stops
          </Link>
          <Link to="/brokers" className={`nav-link ${isActive('/brokers') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Star size={16} /> Brokers
          </Link>
          <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Trophy size={16} /> Leaderboard
          </Link>
          <Link to="/route" className={`nav-link ${isActive('/route') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Navigation size={16} /> Route
          </Link>
          <Link to="/calculator" className={`nav-link ${isActive('/calculator') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Calculator size={16} /> Calculator
          </Link>
          <Link to="/timer" className={`nav-link ${isActive('/timer') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Clock size={16} /> Timer
          </Link>
          <Link to="/invoice" className={`nav-link ${isActive('/invoice') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <FileText size={16} /> Invoice
          </Link>
          <Link to="/safety" className={`nav-link ${isActive('/safety') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Shield size={16} /> Safety
          </Link>
          <Link to="/add-facility" className={`nav-link ${isActive('/add-facility') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Plus size={16} /> Add Dock
          </Link>
          <Link to="/pricing" className={`nav-link nav-pro ${isActive('/pricing') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <DollarSign size={16} /> Go Pro
          </Link>
          {user ? (
            <>
              <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                <User size={16} /> Profile
              </Link>
              <button className="nav-link nav-signout" onClick={handleSignOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  )
}
