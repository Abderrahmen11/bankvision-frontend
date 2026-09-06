import React from 'react'
import { ShieldCheck, HelpCircle, ExternalLink } from 'lucide-react'
import './Footer.css'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bankvision-footer">
      <div className="footer-content">
        {/* Left: Copyright & System version */}
        <div className="footer-left">
          <span className="footer-copyright">
            © {currentYear} <strong>BankVision</strong> Financial Systems. All rights reserved.
          </span>
          <span className="footer-version-tag">v2.4.0-enterprise</span>
        </div>

        {/* Center: Live System Status */}
        <div className="footer-center">
          <div className="footer-system-status">
            <span className="status-indicator-dot" />
            <span className="status-text">Core Banking Engine: Operational</span>
          </div>
        </div>

        {/* Right: Regulatory and Help Links */}
        <div className="footer-right">
          <a
            href="#security"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            <ShieldCheck size={14} />
            <span>Security</span>
          </a>
          <a
            href="#docs"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            <ExternalLink size={14} />
            <span>API Docs</span>
          </a>
          <a
            href="#helpdesk"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            <HelpCircle size={14} />
            <span>Support Desk</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
