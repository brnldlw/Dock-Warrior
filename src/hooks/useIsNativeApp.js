// Returns true when running inside the DockWarrior native iOS/Android app
export function useIsNativeApp() {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('DockWarriorApp')
}
