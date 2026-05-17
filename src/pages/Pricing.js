import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { CheckCircle, XCircle, Shield, Zap, Star, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
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
  'Route alerts — bad docks on your lane',
  'Safety check-in with SMS alerts',
  'Professional PDF detention invoice',
  'Full detention history export',
  'Pro badge on your profile',
  'Early access to new features',
]

const FLEET_FEATURES = [
  'Everything in Pro for every driver',
  'Fleet detention dashboard',
  'Dock performance reports by route',
  'Broker payment history across fleet',
  'Exportable data for dispatch',
  'Dedicated account manager',
]

export default function Pricing() {
  const { user } = useAuth()
  const { isPro, startCheckout, loading } = useSubscription()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const upgraded = searchParams.get('upgraded')
  const cancelled = searchParams.get('cancelled')

  const handleProClick = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    if (isPro) {
      toast('You are already a Pro member!')
      return
    }
    setCheckoutLoading(true)
    const result = await startCheckout()
    if (!result?.url) {
      toast.error('Something went wrong. Try again.')
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="page pricing-page">

      {/* SUCCESS BANNER */}
      {upgraded && (
        <div className="upgrade-banner">
          <CheckCircle size={20} />
          <span>Welcome to Pro! Your account has been upgraded. Refresh your profile to see your Pro badge.</span>
        </div>
      )}

      {/* CANCELLED BANNER */}
      {cancelled && (
        <div className="cancelled-banner">
          <AlertTriangle size={20} />
          <span>Payment cancelled. No charge was made. Upgrade anytime you're ready.</span>
        </div>
      )}

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

          {isPro ? (
            <div className="pro-active-badge">
              <CheckCircle size={16} /> You're a Pro Member
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}
              onClick={handleProClick}
              disabled={checkoutLoading || loading}
            >
              <Zap size={16} />
              {checkoutLoading ? 'Loading...' : user ? 'Upgrade to Pro — $9/mo' : 'Sign In to Upgrade'}
            </button>
          )}

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
          <p className="pricing-desc">For carriers who want real dock intelligence across their entire operation.</p>
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
            { q: 'How do I pay?', a: 'Credit or debit card through Stripe — the same secure payment processor used by Amazon and millions of other businesses. Your card info never touches our servers.' },
            { q: 'Can I cancel Pro anytime?', a: 'Yes. Cancel any time with no fees. Your account drops back to Free at the end of your billing period.' },
            { q: 'Is my data private?', a: 'Your personal information is never sold. Aggregate dock performance data (not tied to you personally) may be used for B2B reporting.' },
            { q: 'What if my fleet has 50+ trucks?', a: 'Contact us at fleet@dockwarrior.com for custom enterprise pricing and volume discounts.' },
            { q: 'What payment methods are accepted?', a: 'All major credit and debit cards — Visa, Mastercard, American Express, Discover.' },
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
