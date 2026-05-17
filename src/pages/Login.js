import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import './Login.css'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        toast.success('Welcome back, Warrior!')
        navigate('/')
      } else {
        if (!fullName.trim()) { toast.error('Enter your name'); setLoading(false); return }
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        toast.success('Account created! Check your email to confirm.')
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <Shield size={40} className="login-icon" />
          <h1>DOCK<span style={{ color: 'var(--orange)' }}>WARRIOR</span></h1>
          <p>{mode === 'signin' ? 'Sign in to your account' : 'Create your free account'}</p>
        </div>

        <div className="toggle-group" style={{ marginBottom: 28 }}>
          <button
            className={`toggle-pill ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => setMode('signin')}
          >Sign In</button>
          <button
            className={`toggle-pill ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >Create Account</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input
                  className="form-input input-with-icon"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                className="form-input input-with-icon"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                className="form-input input-with-icon"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="login-footer">
          Free forever for drivers. No credit card required.
        </p>
      </div>
    </div>
  )
}
