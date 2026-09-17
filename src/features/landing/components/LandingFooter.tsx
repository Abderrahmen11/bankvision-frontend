import React from 'react'
import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { label: 'Platform', href: '#capabilities' },
  { label: 'Roles', href: '#personas' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Sign in', href: '/login' },
]

export const LandingFooter: React.FC = () => (
  <footer className="lp-footer">
    <div className="lp-footer-inner">
      <div className="lp-footer-brand">
        <Link to="/" className="lp-brand" aria-label="BankVision home">
          <svg viewBox="0 0 32 32" className="lp-brand-glyph" aria-hidden="true">
            <rect x="1" y="1" width="30" height="30" rx="9" />
            <path d="M12 22V10l8 12V10" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>BankVision</span>
        </Link>
        <p>Banking intelligence for modern institutions.</p>
      </div>

      <nav className="lp-footer-links" aria-label="Footer">
        {FOOTER_LINKS.map((link) =>
          link.href.startsWith('/') ? (
            <Link key={link.label} to={link.href}>
              {link.label}
            </Link>
          ) : (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          )
        )}
      </nav>
    </div>

    <div className="lp-footer-legal">
      <span>© {new Date().getFullYear()} BankVision. All rights reserved.</span>
      <div>
        <a href="#">Privacy policy</a>
        <a href="#">Terms of service</a>
      </div>
    </div>
  </footer>
)
