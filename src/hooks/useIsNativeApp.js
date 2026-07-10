// Returns true when running inside the DockWarrior native iOS/Android app
export function useIsNativeApp() {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('DockWarriorApp')
}

// Send a message to the native app shell
export function sendNativeMessage(type, payload) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, payload || {})))
  }
}

// Trigger the native IAP paywall
export function showNativePaywall() {
  sendNativeMessage('SHOW_PAYWALL')
}
