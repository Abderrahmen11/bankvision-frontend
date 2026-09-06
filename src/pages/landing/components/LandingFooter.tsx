import React from 'react'
import { Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'

export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <div className="footer-top-row">
          <div className="footer-brand-info">
            <Link
              to="/"
              className="landing-brand"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="landing-brand-icon">
                <Landmark size={20} />
              </div>
              <div className="landing-brand-text">
                <span className="brand-title">BankVision</span>
                <span className="brand-subtitle">Financial Operating System</span>
              </div>
            </Link>
            <p className="footer-brand-tagline">
              Next-generation core banking ledger, automated risk scoring, and institutional financial governance.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h5 className="footer-col-title">PLATFORM</h5>
              <a href="#features" className="footer-link-item">Account Ledger</a>
              <a href="#features" className="footer-link-item">Risk & AML Intelligence</a>
              <a href="#features" className="footer-link-item">Loan Origination</a>
              <Link to="/docs" className="footer-link-item">Documentation & API</Link>
            </div>

            <div className="footer-col">
              <h5 className="footer-col-title">PERSONAS</h5>
              <a href="#demo-roles" className="footer-link-item">System Administrator</a>
              <a href="#demo-roles" className="footer-link-item">Branch Manager</a>
              <a href="#demo-roles" className="footer-link-item">Compliance Officer</a>
              <a href="#demo-roles" className="footer-link-item">CSR & Teller Staff</a>
            </div>

            <div className="footer-col">
              <h5 className="footer-col-title">SECURITY & COMPLIANCE</h5>
              <span className="footer-link-item">SOC2 Type II Aligned</span>
              <span className="footer-link-item">Basel III Regulatory Standards</span>
              <span className="footer-link-item">256-bit TLS 1.3 Data in Transit</span>
              <span className="footer-link-item">Immutable Audit Trails</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-row">
          <div className="footer-copyright-text">
            &copy; {currentYear} BankVision Core Banking Platform. All rights reserved. Built for enterprise financial institutions.
          </div>
          <div className="footer-status-pill">
            <span className="status-dot-active" />
            <span>Core Ledger Status: Operational (99.999% SLA)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
