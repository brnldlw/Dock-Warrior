import { Link } from 'react-router-dom'
import { Search, Clock, Star, Shield, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import './Home.css'

const STATS = [
  { value: '119 min', label: 'Avg wait time per stop' },
  { value: '$1.3B', label: 'Lost annually to detention' },
  { value: '79%', label: 'Never receive detention pay' },
]

const FEATURES = [
  {
    icon: <Search size={28} />,
    title: 'Search Any Dock',
    desc: 'Look up any shipper or receiver before you roll in. Real ratings from real drivers.'
  },
  {
    icon: <Star size={28} />,
    title: 'Honest Reviews',
    desc: 'Wait times, detention pay history, lumper fees, bathroom access, driver respect scores.'
  },
  {
    icon: <Clock size={28} />,
    title: 'Detention Timer',
    desc: 'One tap to start the clock. Auto-generates a detention invoice you can text to your broker.'
  },
  {
    icon: <Shield size={28} />,
    title: 'Driver Protection',
    desc: 'Document everything. Build your paper trail. Know your rights at every dock.'
  }
]

const RECENT_REVIEWS = [
  {
    facility: 'Amazon MDW2 — Joliet, IL',
    rating: 2,
    wait: '4.5 hrs',
    detention: false,
    comment: 'Showed up at appointment time, sat in the lot for 4 hours. No communication from anyone inside. Detention? Good luck getting that.'
  },
  {
    facility: 'SYSCO Indianapolis',
    rating: 4,
    wait: '45 min',
    detention: true,
    comment: 'One of the better ones. In and out in under an hour. They actually answer the intercom.'
  },
  {
    facility: 'Walmart DC #6097 — Bentonville, AR',
    rating: 1,
    wait: '6+ hrs',
    detention: false,
    comment: 'Six hours. No detention paid. Broker said it was in the contract. Read your rate cons carefully on Walmart loads.'
  }
]

function StarDisplay({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= rating ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="badge badge-orange">Built by drivers, for drivers</span>
          </div>
          <h1 className="hero-title">
            Know the dock<br />
            <span className="hero-accent">before you roll in.</span>
          </h1>
          <p className="hero-subtitle">
            DockWarrior is the crowdsourced intelligence platform where truck drivers
            share the real story on shippers and receivers — wait times, detention pay,
            lumper fees, and whether they actually treat you like a human being.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary btn-lg">
              <Search size={20} />
              Search a Dock
            </Link>
            <Link to="/timer" className="btn btn-secondary btn-lg">
              <Clock size={20} />
              Start Detention Timer
            </Link>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="stat-block">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* RECENT REVIEWS PREVIEW */}
      <section className="reviews-preview">
        <div className="container">
          <div className="section-header">
            <div className="accent-line" />
            <h2>What drivers are saying</h2>
            <p>Real reviews from verified CDL drivers.</p>
          </div>
          <div className="reviews-list">
            {RECENT_REVIEWS.map((r, i) => (
              <div key={i} className="preview-review card">
                <div className="review-top">
                  <div>
                    <div className="review-facility">{r.facility}</div>
                    <StarDisplay rating={r.rating} />
                  </div>
                  <div className="review-meta">
                    <span className="stat-chip">
                      <Clock size={13} />
                      <strong>{r.wait}</strong> wait
                    </span>
                    {r.detention ? (
                      <span className="badge badge-green">
                        <CheckCircle size={12} /> Detention Paid
                      </span>
                    ) : (
                      <span className="badge badge-red">
                        <XCircle size={12} /> Detention Denied
                      </span>
                    )}
                  </div>
                </div>
                <p className="review-comment">"{r.comment}"</p>
              </div>
            ))}
          </div>
          <div className="reviews-cta">
            <Link to="/search" className="btn btn-secondary">
              See All Reviews <ChevronRight size={16} />
            </Link>
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
              <p>Search any facility, leave a review, and start the detention timer — free, always.</p>
            </div>
            <Link to="/search" className="btn btn-primary btn-lg">
              Get Started <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
