import React from 'react'
import { Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'

export const DocsFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="docs-footer">
      <div className="docs-footer-container">
        <div className="docs-footer-brand">
          <Link to="/" className="docs-brand">
            <div className="docs-brand-icon"><Landmark size={18} /></div>
            <span className="brand-name">BankVision Documentation</span>
          </Link>
          <span className="docs-footer-copy">
            &copy; {currentYear} BankVision Financial Operating System.
          </span>
        </div>
        <div className="docs-footer-links">
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/login" className="footer-link">Staff Login</Link>
          <a href="#overview" className="footer-link">Overview</a>
          <a href="#faq" className="footer-link">FAQ</a>
        </div>
      </div>
    </footer>
  )
}
