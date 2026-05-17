import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

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
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setSubscription(data)
    } catch (err) {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const isPro = subscription?.status === 'active' && subscription?.plan === 'pro'

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

  return { subscription, loading, isPro, startCheckout, refetch: fetchSubscription }
}
