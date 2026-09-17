import { useAuth } from '@/shared/hooks'
import React, { useEffect, useState } from 'react'
import { settingsApi } from '@/features/settings/api/settings'
import { env } from '@/shared/config/env'
import './Footer.css'

type HealthTone = 'operational' | 'degraded' | 'down'

/** Overall status = worst of the individual subsystem statuses. */
function overallStatus(health: {
  database: { status: string }
  cache: { status: string }
  storage: { status: string }
}): HealthTone {
  const statuses = [health.database.status, health.cache.status, health.storage.status]
  if (statuses.includes('down')) return 'down'
  if (statuses.includes('degraded')) return 'degraded'
  return 'operational'
}

const STATUS_LABELS: Record<HealthTone, string> = {
  operational: 'Core Banking Engine: Operational',
  degraded: 'Core Banking Engine: Degraded',
  down: 'Core Banking Engine: Unavailable',
}

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const { isAdmin } = useAuth()
  const [status, setStatus] = useState<HealthTone | null>(null)

  // Fetch the real platform health once per layout mount (admin-only endpoint,
  // so other roles simply don't show the status pill).
  useEffect(() => {
    if (!isAdmin) return
    let active = true
    settingsApi
      .getSystemHealth()
      .then((health) => {
        if (active) setStatus(overallStatus(health))
      })
      .catch(() => {
        if (active) setStatus(null)
      })
    return () => {
      active = false
    }
  }, [isAdmin])

  return (
    <footer className="bankvision-footer">
      <div className="footer-content">
        {/* Left: Copyright & System version */}
        <div className="footer-left">
          <span className="footer-copyright">
            © {currentYear} <strong>BankVision</strong> Financial Systems. All rights reserved.
          </span>
          <span className="footer-version-tag">v{env.appVersion}</span>
        </div>

        {/* Center: Live System Status */}
        {status && (
          <div className="footer-center">
            <div className={`footer-system-status status-${status}`}>
              <span className="status-indicator-dot" />
              <span className="status-text">{STATUS_LABELS[status]}</span>
            </div>
          </div>
        )}
      </div>
    </footer>
  )
}
