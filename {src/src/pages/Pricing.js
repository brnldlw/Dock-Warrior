import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Shield, Zap, Star } from 'lucide-react'
import './Pricing.css'

const FREE_FEATURES = [
  'Search any dock or facility',
  'Read all driver reviews',
  'Detention timer (unlimited)',
  'Basic detention report download',
  'Broker ratings — read only',
  'Submit up to 5 reviews/month',
  'Driver profile and badges',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited review submissions',
  'Full broker rating submission',
  'Route alerts — get notified of bad docks on your lane',
  'Safety check-in feature',
  'Detention invoice PDF (broker-ready format)',
  'Full detention history export',
  'Priority listings in search results',
  'Pro badge on your profile',
  'Early access to new features',
]

const FLEET_FEATURES = [
  'Everything in Pro for every driver',
  'Fleet dashboard — all driver detention logs',
  'Dock performance reports by route',
  'Broker payment history across your fleet',
  'Exportable data for dispatch teams',
  'Dedicated account manager',
  'Custom integrations available',
]

export default function Pricing() {
  return (
    <div className="page pricing-page">
      <div className="section-header" style={{ textAlign: 'center' }}>
        <div className="accent-line" style={{ margin: '0 auto 16px' }} />
        <h2>Simple, Honest Pricing</h2>
        <p>Free forever for drivers. Upgrade when you're ready for more.</p>
      </div>

      <div className="pricing-grid">
        {/* FREE */}
        <div className="pricing-card card">
          <div className="pricing-tier">Free</div>
          <div className="pricing-price">
            <span className="price-amount">$0</span>
            <span className="price-period">forever</span>
          </div>
          <p className="pricing-desc">Everything a driver needs to roll in informed and document detention.</p>
          <Link to="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}>
            Get Started Free
          </Link>
          <div className="pricing-features">
            {FREE_FEATURES.map((f, i) => (
              <div key={i} className="pricing-feature">
                <CheckCircle size={15} className="feature-check" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRO */}
        <div className="pricing-card card pricing-card-pro">
          <div className="pricing-badge">Most Popular</div>
          <div className="pricing-tier">Pro</div>
          <div className="pricing-price">
            <span className="price-amount">$9</span>
            <span className="price-period">/month</span>
          </div>
          <p className="pricing-desc">For serious owner-operators who want every edge on every load.</p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }} onClick={() => alert('Stripe payments coming soon! Enter your email and we\'ll notify you when Pro launches.')}>
            <Zap size={16} /> Start Pro — Coming Soon
          </button>
          <div className="pricing-features">
            {PRO_FEATURES.map((f, i) => (
              <div key={i} className="pricing-feature">
                <CheckCircle size={15} className="feature-check feature-check-pro" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FLEET */}
        <div className="pricing-card card">
          <div className="pricing-tier">Fleet</div>
          <div className="pricing-price">
            <span className="price-amount">$20</span>
            <span className="price-period">/truck/mo</span>
          </div>
          <p className="pricing-desc">For carriers and fleet operators who want real dock intelligence across their entire operation.</p>
          <a href="mailto:fleet@dockwarrior.com" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}>
            <Shield size={16} /> Contact for Fleet Pricing
          </a>
          <div className="pricing-features">
            {FLEET_FEATURES.map((f, i) => (
              <div key={i} className="pricing-feature">
                <CheckCircle size={15} className="feature-check" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="pricing-faq">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <div className="accent-line" style={{ margin: '0 auto 16px' }} />
          <h2>Common Questions</h2>
        </div>
        <div className="faq-grid">
          {[
            { q: 'Is it really free for drivers?', a: 'Yes. Core features — search, read reviews, detention timer — are free forever. We believe every driver deserves access to this information.' },
            { q: 'How do you make money?', a: 'Pro subscriptions, fleet licensing, and anonymized dock performance data sold to shippers and brokers who want to improve their operations.' },
            { q: 'Can I cancel Pro anytime?', a: 'Yes. Cancel any time with no fees. Your data stays in your account on the Free tier.' },
            { q: 'Is my data private?', a: 'Your personal information is never sold. Aggregate dock performance data (not tied to you personally) may be used for B2B reporting.' },
            { q: 'What if my fleet has 500 trucks?', a: 'Contact us at fleet@dockwarrior.com for custom enterprise pricing.' },
            { q: 'When does Pro launch?', a: 'Very soon. Enter your email on sign up and you\'ll be first to know.' },
          ].map((item, i) => (
            <div key={i} className="faq-item card">
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
