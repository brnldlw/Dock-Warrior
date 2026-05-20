import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { Link } from 'react-router-dom'
import { Gift, Copy, CheckCircle, Users, Crown, Share2, Zap, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import './Referral.css'

function generateCode(userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seed = userId.replace(/-/g, '').slice(0, 8)
  let code = 'DW'
  for (let i = 0; i < 6; i++) {
    const charIndex = parseInt(seed[i] || '0', 16) % chars.length
    code += chars[charIndex]
  }
  return code
}

export default function Referral() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const [referral, setReferral] = useState(null)
  const [signups, setSignups] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user) {
      initReferral()
    } else {
      setLoading(false)
    }
  }, [user])

  const initReferral = async () => {
    setLoading(true)
    try {
      // Check if user already has a referral code
      const { data: existing } = await supabase
        .from('referrals')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        setReferral(existing)
      } else {
        // Create one
        const code = generateCode(user.id)
        const { data: created, error } = await supabase
          .from('referrals')
          .insert({ user_id: user.id, referral_code: code })
          .select()
          .single()

        if (!error) setReferral(created)
      }

      // Fetch signups
      const { data: sups } = await supabase
        .from('referral_signups')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false })

      setSignups(sups || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const referralLink = referral
    ? `https://app.dockwarrior.com/signup?ref=${referral.referral_code}`
    : ''

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 3000)
  }

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'DockWarrior — Free Trucking Intelligence App',
        text: 'Check out DockWarrior — dock ratings, AI co-driver, load calculator, and more. Free for drivers.',
        url: referralLink
      })
    } else {
      copyLink()
    }
  }

  const freeMonthsEarned = referral?.free_months_earned || 0
  const totalSignups = referral?.total_signups || 0
  const totalConversions = referral?.total_conversions || 0

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <Gift size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>Sign in to get your referral link</h3>
          <p>Share DockWarrior with other drivers and earn free Pro months.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 20 }}>Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Gift size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Refer a Driver</h2>
        <p>Share DockWarrior with other drivers. Every driver who signs up through your link earns you a free month of Pro.</p>
      </div>

      {/* HOW IT WORKS */}
      <div className="referral-how">
        <div className="referral-step">
          <div className="ref-step-num">1</div>
          <div className="ref-step-icon"><Share2 size={24} /></div>
          <div className="ref-step-text"><strong>Share your link</strong>Post it in Facebook groups, text it to driver friends, drop it in trucker forums.</div>
        </div>
        <div className="referral-arrow">→</div>
        <div className="referral-step">
          <div className="ref-step-num">2</div>
          <div className="ref-step-icon"><Users size={24} /></div>
          <div className="ref-step-text"><strong>Driver signs up</strong>They create a free account using your referral link.</div>
        </div>
        <div className="referral-arrow">→</div>
        <div className="referral-step">
          <div className="ref-step-num">3</div>
          <div className="ref-step-icon"><Crown size={24} /></div>
          <div className="ref-step-text"><strong>You earn a free month</strong>When they upgrade to Pro you get one free month of Pro added to your account.</div>
        </div>
      </div>

      {/* YOUR LINK */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" />Setting up your referral link...</div>
      ) : (
        <>
          <div className="card referral-link-card">
            <h3 className="referral-link-title">Your Referral Link</h3>
            <div className="referral-link-row">
              <div className="referral-link-display">{referralLink}</div>
              <button className="btn btn-primary" onClick={copyLink}>
                {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
              </button>
              <button className="btn btn-secondary" onClick={shareLink}>
                <Share2 size={16} /> Share
              </button>
            </div>
            <div className="referral-code-row">
              Your code: <strong className="referral-code">{referral?.referral_code}</strong>
            </div>
          </div>

          {/* STATS */}
          <div className="referral-stats">
            <div className="card referral-stat">
              <div className="ref-stat-value">{totalSignups}</div>
              <div className="ref-stat-label">Drivers Referred</div>
            </div>
            <div className="card referral-stat">
              <div className="ref-stat-value">{totalConversions}</div>
              <div className="ref-stat-label">Upgraded to Pro</div>
            </div>
            <div className="card referral-stat">
              <div className="ref-stat-value" style={{ color: 'var(--orange)' }}>{freeMonthsEarned}</div>
              <div className="ref-stat-label">Free Months Earned</div>
            </div>
          </div>

          {/* SIGNUPS LIST */}
          {signups.length > 0 && (
            <div className="card referral-signups">
              <h3 className="referral-signups-title">Your Referrals</h3>
              <div className="signups-list">
                {signups.map(s => (
                  <div key={s.id} className="signup-item">
                    <div className="signup-date">{new Date(s.created_at).toLocaleDateString()}</div>
                    <div className="signup-status">
                      {s.converted_to_pro
                        ? <span className="badge badge-orange"><Crown size={11} /> Upgraded to Pro</span>
                        : <span className="badge badge-gray">Free User</span>}
                    </div>
                    <div className="signup-earned">
                      {s.converted_to_pro ? <span style={{ color: 'var(--green)' }}>+1 free month earned</span> : <span style={{ color: 'var(--text-muted)' }}>Pending upgrade</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHARE IDEAS */}
          <div className="card referral-ideas">
            <h3 className="referral-ideas-title"><Share2 size={18} /> Where to Share</h3>
            <div className="share-ideas-grid">
              {[
                { icon: '👥', title: 'Facebook Groups', desc: 'Owner Operators of America, Truckers Justice Network, Women in Trucking, your local driver groups.' },
                { icon: '💬', title: 'Text Your Driver Friends', desc: 'Every driver you know who deals with detention, bad docks, or shady brokers needs this app.' },
                { icon: '🚛', title: 'At the Dock', desc: 'Waiting at a dock? Tell the driver next to you about DockWarrior. They have time to check it out.' },
                { icon: '📱', title: 'Reddit', desc: 'r/Truckers, r/TruckerDave, r/LongHaulTrucking — share your honest experience with the app.' },
              ].map((idea, i) => (
                <div key={i} className="share-idea">
                  <span className="share-idea-icon">{idea.icon}</span>
                  <div>
                    <strong>{idea.title}</strong>
                    <p>{idea.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SUGGESTED POST */}
          <div className="card referral-template">
            <h3 className="referral-ideas-title">💬 Copy This Post</h3>
            <div className="template-text">
              {`Hey warriors — found an app that's been saving me money every week. DockWarrior has dock ratings, broker pay history, detention timer that generates an actual invoice, and an AI co-driver that helped me collect $340 in detention I never would have fought for. Free to use. Check it out: ${referralLink}`}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              navigator.clipboard.writeText(`Hey warriors — found an app that's been saving me money every week. DockWarrior has dock ratings, broker pay history, detention timer that generates an actual invoice, and an AI co-driver that helped me collect $340 in detention I never would have fought for. Free to use. Check it out: ${referralLink}`)
              toast.success('Post copied!')
            }}>
              <Copy size={14} /> Copy This Post
            </button>
          </div>
        </>
      )}
    </div>
  )
}
