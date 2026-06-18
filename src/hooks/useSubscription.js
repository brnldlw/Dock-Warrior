import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const TRIAL_DAYS_DEFAULT = 14

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }
    fetchSubscription()
  }, [user])

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!data || error) {
        // Fallback: no subscription row exists yet (e.g. the DB trigger
        // wasn't set up before this user signed up). Grant a trial now
        // so nobody falls through the cracks.
        const trialEnd = new Date(Date.now() + TRIAL_DAYS_DEFAULT * 24 * 60 * 60 * 1000).toISOString()
        const { data: created } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            status: 'active',
            plan: 'pro',
            current_period_end: trialEnd,
            trial_granted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
          .select()
          .single()
        setSubscription(created || null)
      } else {
        setSubscription(data)
      }
    } catch (err) {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  // A user counts as Pro if status is active AND (it's a paid sub with no
  // end date, OR the trial/period end date hasn't passed yet).
  const now = new Date()
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
  const isExpired = periodEnd ? periodEnd.getTime() < now.getTime() : false
  const isPro = subscription?.status === 'active' && subscription?.plan === 'pro' && !isExpired

  const isTrialing = isPro && !!subscription?.trial_granted_at
  const daysRemaining = periodEnd
    ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  const startCheckout = async () => {
    if (!user) return null
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email
        })
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
      return data
    } catch (err) {
      console.error('Checkout error:', err)
      return null
    }
  }

  return {
    subscription,
    loading,
    isPro,
    isTrialing,
    isExpired,
    daysRemaining,
    startCheckout,
    refetch: fetchSubscription
  }
}
