import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield, Search, Clock, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Navbar.css'

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

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <Shield size={24} className="brand-icon" />
          <span className="brand-text">DOCK<span className="brand-accent">WARRIOR</span></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link
            to="/search"
            className={`nav-link ${isActive('/search') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <Search size={16} />
            Search Docks
          </Link>
          <Link
            to="/timer"
            className={`nav-link ${isActive('/timer') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <Clock size={16} />
            Detention Timer
          </Link>
          {user ? (
            <>
              <Link
                to="/profile"
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} />
                Profile
              </Link>
              <button className="nav-link nav-signout" onClick={handleSignOut}>
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary btn-sm"
              onClick={() => setMenuOpen(false)}
            >
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
