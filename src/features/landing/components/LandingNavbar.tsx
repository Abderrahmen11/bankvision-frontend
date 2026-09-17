import React from 'react'
import { Sun, Moon, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/shared/hooks'

const NAV_LINKS = [
  { label: 'Platform', href: '#capabilities' },
  { label: 'Roles', href: '#personas' },
  { label: 'Trust', href: '#proof' },
  { label: 'Docs', href: '/docs' },
]

export const LandingNavbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="lp-nav-wrap">
      <div className="lp-nav">
        <Link to="/" className="lp-brand" aria-label="BankVision home">
          <svg viewBox="0 0 32 32" className="lp-brand-glyph" aria-hidden="true">
            <rect x="1" y="1" width="30" height="30" rx="9" />
            <path d="M12 22V10l8 12V10" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>BankVision</span>
        </Link>

        <input type="checkbox" id="lp-nav-toggle" className="lp-nav-toggle" aria-hidden="true" tabIndex={-1} />
        <nav className="lp-nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) =>
            link.href.startsWith('/') ? (
              <Link key={link.label} to={link.href} className="lp-nav-link">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="lp-nav-link">
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="lp-nav-actions">
          <button
            type="button"
            className="lp-icon-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-sm">
            Sign in
          </Link>
          <label htmlFor="lp-nav-toggle" className="lp-icon-btn lp-burger" aria-label="Toggle menu">
            <Menu size={18} />
          </label>
        </div>
      </div>
    </header>
  )
}
