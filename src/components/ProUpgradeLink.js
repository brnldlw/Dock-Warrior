import { Link } from 'react-router-dom'
import { useIsNativeApp } from '../hooks/useIsNativeApp'

/**
 * Drop-in replacement for <Link to="/pricing">.
 * In the native iOS app it shows "Visit dockwarrior.com to subscribe" text
 * instead of a button, satisfying Apple guideline 3.1.1.
 * On web it behaves exactly like a normal Link to /pricing.
 */
export default function ProUpgradeLink({ className, style, children }) {
  const isNative = useIsNativeApp()

  if (isNative) {
    return (
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', ...style }}>
        Subscribe at dockwarrior.com
      </span>
    )
  }

  return (
    <Link to="/pricing" className={className} style={style}>
      {children}
    </Link>
  )
}
