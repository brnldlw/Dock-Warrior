import { Link } from 'react-router-dom'
import { useIsNativeApp, showNativePaywall } from '../hooks/useIsNativeApp'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Clock, Star, Shield, ChevronRight, AlertTriangle, CheckCircle, XCircle, Trophy, Zap, Users, DollarSign } from 'lucide-react'
import './Home.css'

const FEATURES = [
  { icon: <Search size={28} />, title: 'Search Any Dock', desc: 'Look up any shipper or receiver before you roll in. Real ratings from real drivers — not corporate PR.' },
  { icon: <Star size={28} />, title: 'Honest Reviews', desc: 'Wait times, detention pay history, lumper fees, bathroom access, and whether they treat you like a human being.' },
  { icon: <Clock size={28} />, title: 'Detention Timer', desc: 'One tap starts the clock. Auto-generates a detention invoice you can send directly to your broker.' },
  { icon: <DollarSign size={28} />, title: 'Broker Ratings', desc: 'Know which brokers pay fast and which ghost you for 90 days. Rated by drivers who\'ve been burned.' },
  { icon: <Trophy size={28} />, title: 'Weekly Leaderboard', desc: 'The worst docks in America, ranked by real driver experience. Share it. Warn your brothers and sisters.' },
  { icon: <Shield size={28} />, title: 'Safety Check-In', desc: 'Set a timer when you arrive at an unfamiliar dock. Your emergency contact gets alerted if you don\'t check back in.' },
]

const TESTIMONIALS = [
  { name: 'Mike T.', location: 'Dallas, TX', text: 'Checked DockWarrior before a Walmart load. Saw the 6-hour average wait. Negotiated a better layover rate before I even left the house. This app paid for itself day one.' },
  { name: 'Sandra R.', location: 'Atlanta, GA', text: 'The detention timer is everything. I used to lose track of time and forget to document. Now I have a paper trail for every stop and I\'ve collected detention pay three times this month.' },
  { name: 'James K.', location: 'Chicago, IL', text: 'Finally an app built FOR drivers not FOR shippers. The broker ratings alone are worth it. I know who to avoid before I accept a load.' },
]

function StatCounter({ value, label }) {
  return (
    <div className="stat-block">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Home() {
  const isNative = useIsNativeApp()
  const [worstDocks, setWorstDocks] = useState([])
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { count } = await supabase.from('reviews').select('*', { count: 'exact', head: true })
    setTotalReviews(count || 0)

    const { data } = await supabase
      .from('facilities')
      .select('*, reviews(overall_rating, wait_time_minutes)')
      .limit(20)

    if (data) {
      const enriched = data
        .map(f => {
          const reviews = f.reviews || []
          const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length : null
          const avgWait = reviews.filter(r => r.wait_time_minutes).length > 0
            ? reviews.filter(r => r.wait_time_minutes).reduce((s, r) => s + r.wait_time_minutes, 0) / reviews.filter(r => r.wait_time_minutes).length
            : null
          return { ...f, avg_rating: avg, avg_wait: avgWait, review_count: reviews.length }
        })
        .filter(f => f.avg_rating !== null)
        .sort((a, b) => a.avg_rating - b.avg_rating)
        .slice(0, 3)
      setWorstDocks(enriched)
    }
  }

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="badge badge-orange">
              <Zap size={12} /> Built by drivers, for drivers
            </span>
          </div>
          <h1 className="hero-title">
            Know the dock<br />
            <span className="hero-accent">before you roll in.</span>
          </h1>
          <p className="hero-subtitle">
            DockWarrior is the crowdsourced intelligence platform where truck drivers
            share the real story on shippers, receivers, and brokers.
            Wait times. Detention pay. Lumper fees. Broker payment speed.
            All from drivers who've been there.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary btn-lg">
              <Search size={20} /> Search a Dock
            </Link>
            <Link to="/leaderboard" className="btn btn-secondary btn-lg">
              <Trophy size={20} /> Worst Docks This Week
            </Link>
          </div>
        </div>
      </section>

      {/* LIVE STATS BAR */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <StatCounter value={totalReviews > 0 ? `${totalReviews}+` : 'Growing'} label="Driver Reviews" />
            <StatCounter value="119 min" label="Avg wait time per stop" />
            <StatCounter value="$1.3B" label="Lost annually to detention" />
            <StatCounter value="79%" label="Never receive detention pay" />
          </div>
        </div>
      </section>

      {/* WORST DOCKS PREVIEW */}
      {worstDocks.length > 0 && (
        <section className="worst-docks-section">
          <div className="container">
            <div className="section-header">
              <div className="accent-line" />
              <h2>⚠ Worst Docks Right Now</h2>
              <p>Rated by real drivers this week. Avoid these if you can.</p>
            </div>
            <div className="worst-docks-list">
              {worstDocks.map((dock, i) => (
                <Link to={`/facility/${dock.id}`} key={dock.id} className="worst-dock-card card card-clickable">
                  <div className="worst-rank">#{i + 1}</div>
                  <div className="worst-info">
                    <div className="worst-name">{dock.name}</div>
                    <div className="worst-location">{dock.city}, {dock.state}</div>
                  </div>
                  <div className="worst-stats">
                    <div className="worst-rating">{dock.avg_rating?.toFixed(1)} ★</div>
                    {dock.avg_wait && <div className="worst-wait">{Math.round(dock.avg_wait)} min avg wait</div>}
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/leaderboard" className="btn btn-secondary">
                Full Leaderboard <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="accent-line" />
            <h2>Your intel. Your edge.</h2>
            <p>Everything you need to stop getting burned at the dock.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="accent-line" />
            <h2>How It Works</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">01</div>
              <h3>Search the Dock</h3>
              <p>Look up any facility by name or address before you accept a load or pull in.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">02</div>
              <h3>Read Real Reviews</h3>
              <p>See wait times, detention pay history, lumper costs, and driver respect scores from verified drivers.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">03</div>
              <h3>Roll In Informed</h3>
              <p>Start the detention timer on arrival. Document everything. Get paid what you're owed.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">04</div>
              <h3>Leave Your Review</h3>
              <p>Pay it forward. Your review protects the next driver. The community grows stronger together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <div className="accent-line" />
            <h2>What Warriors Are Saying</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-location">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-inner">
            <AlertTriangle size={32} className="cta-icon" />
            <div>
              <h2>Stop getting stuck at bad docks.</h2>
              <p>Free forever for drivers. Join thousands of warriors who roll in informed.</p>
            </div>
            <div className="cta-buttons">
              <Link to="/login" className="btn btn-primary btn-lg">
                Create Free Account
              </Link>
              {isNative ? (
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Visit dockwarrior.com to subscribe</span>
              ) : (
                <Link to="/pricing" className="btn btn-secondary btn-lg">See Pro Features</Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


