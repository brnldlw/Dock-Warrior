import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { CheckCircle, Shield, Zap, AlertTriangle, Crown } from 'lucide-react'
import './Pricing.css'

const FREE_FEATURES = ['Search any dock or facility','Read all driver reviews','Detention timer (unlimited)','Basic detention report download','Broker ratings — read only','Submit up to 5 reviews/month','Driver profile and badges']
const PRO_FEATURES = ['Everything in Free','Unlimited review submissions','Full broker rating submission','Route alerts — bad docks on your lane','Safety check-in with SMS alerts','Professional PDF detention invoice','Full detention history export','Pro badge on your profile','Early access to new features']
const FLEET_FEATURES = ['Everything in Pro for every driver','Fleet detention dashboard','Dock performance reports by route','Broker payment history across fleet','Exportable data for dispatch','Dedicated account manager']
const STRIPE_LINK = 'https://buy.stripe.com/7sYeVc47M6Lffhx8GP24000'

export default function Pricing() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const [searchParams] = useSearchParams()

  const handleProClick = () => {
    if (!user) { window.location.href = '/login'; return }
    window.location.href = STRIPE_LINK
  }

  return (
    <div className="page pricing-page">
      {searchParams.get('upgraded') && <div className="upgrade-banner"><CheckCircle size={20} /><span>Welcome to Pro!</span></div>}
      {searchParams.get('cancelled') && <div className="cancelled-banner"><AlertTriangle size={20} /><span>Payment cancelled. No charge made.</span></div>}
      <div className="section-header" style={{textAlign:'center'}}>
        <div className="accent-line" style={{margin:'0 auto 16px'}} />
        <h2>Simple, Honest Pricing</h2>
        <p>Free forever for drivers. Upgrade when you're ready for more.</p>
      </div>
      <div className="pricing-grid">
        <div className="pricing-card card">
          <div className="pricing-tier">Free</div>
          <div className="pricing-price"><span className="price-amount">$0</span><span className="price-period">forever</span></div>
          <p className="pricing-desc">Everything a driver needs to roll in informed and document detention.</p>
          <Link to="/login" className="btn btn-secondary" style={{width:'100%',justifyContent:'center',marginBottom:24}}>Get Started Free</Link>
          <div className="pricing-features">{FREE_FEATURES.map((f,i)=><div key={i} className="pricing-feature"><CheckCircle size={15} className="feature-check"/><span>{f}</span></div>)}</div>
        </div>
        <div className="pricing-card card pricing-card-pro">
          <div className="pricing-badge">Most Popular</div>
          <div className="pricing-tier">Pro</div>
          <div className="pricing-price"><span className="price-amount">$9</span><span className="price-period">/month</span></div>
          <p className="pricing-desc">For serious owner-operators who want every edge on every load.</p>
          {isPro ? (
            <div className="pro-active-badge"><Crown size={16}/> You're a Pro Member</div>
          ) : (
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginBottom:24}} onClick={handleProClick}>
              <Zap size={16}/>{user ? 'Upgrade to Pro — $9/mo' : 'Sign In to Upgrade'}
            </button>
          )}
          <div className="pricing-features">{PRO_FEATURES.map((f,i)=><div key={i} className="pricing-feature"><CheckCircle size={15} className="feature-check feature-check-pro"/><span>{f}</span></div>)}</div>
        </div>
        <div className="pricing-card card">
          <div className="pricing-tier">Fleet</div>
          <div className="pricing-price"><span className="price-amount">$20</span><span className="price-period">/truck/mo</span></div>
          <p className="pricing-desc">For carriers who want real dock intelligence across their entire operation.</p>
          <a href="mailto:fleet@dockwarrior.com" className="btn btn-secondary" style={{width:'100%',justifyContent:'center',marginBottom:24}}><Shield size={16}/> Contact for Fleet Pricing</a>
          <div className="pricing-features">{FLEET_FEATURES.map((f,i)=><div key={i} className="pricing-feature"><CheckCircle size={15} className="feature-check"/><span>{f}</span></div>)}</div>
        </div>
      </div>
    </div>
  )
}