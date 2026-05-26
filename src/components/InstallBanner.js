import { useState, useEffect } from 'react'
import './InstallBanner.css'

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const iOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIOS(iOS)

    // Check if dismissed recently
    const dismissed = localStorage.getItem('dw_install_dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const threeDays = 3 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < threeDays) return
    }

    // Show banner after 30 seconds on iOS, or when install prompt fires on Android
    if (iOS) {
      const timer = setTimeout(() => setShowBanner(true), 30000)
      return () => clearTimeout(timer)
    } else {
      const handlePrompt = () => setShowBanner(true)
      window.addEventListener('beforeinstallprompt', handlePrompt)
      // Also check if already stored
      if (window.deferredInstallPrompt) setShowBanner(true)
      return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS — show instructions
      return
    }
    const prompt = window.deferredInstallPrompt
    if (!prompt) return
    prompt.prompt()
    const result = await prompt.userChoice
    if (result.outcome === 'accepted') {
      setShowBanner(false)
      setIsInstalled(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('dw_install_dismissed', Date.now().toString())
  }

  if (!showBanner || isInstalled) return null

  return (
    <div className="install-banner">
      <div className="install-banner-icon">⚔</div>
      <div className="install-banner-content">
        {isIOS ? (
          <>
            <div className="install-banner-title">Add to Home Screen</div>
            <div className="install-banner-sub">
              Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong>
            </div>
          </>
        ) : (
          <>
            <div className="install-banner-title">Install DockWarrior</div>
            <div className="install-banner-sub">Add to your home screen for quick access</div>
          </>
        )}
      </div>
      {!isIOS && (
        <button className="install-banner-btn" onClick={handleInstall}>
          Install
        </button>
      )}
      <button className="install-banner-close" onClick={handleDismiss}>✕</button>
    </div>
  )
}
