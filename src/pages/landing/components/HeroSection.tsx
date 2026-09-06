import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  TrendingUp,
  Users,
  ShieldCheck,
  Fingerprint,
  Zap,
  Activity,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const HeroSection: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <section className="landing-hero-section">
      <div className="hero-glow-backdrop" />
      <div className="landing-hero-container">
        <div className="hero-content">
          <div className="hero-announcement-badge">
            <span className="badge-pulse-dot" />
            <span className="badge-text">BankVision 2.4 Enterprise Core • Operational</span>
          </div>

          <h1 className="hero-main-title">
            Intelligent Core Banking & <br />
            <span className="gradient-text">Autonomous Risk Governance</span>
          </h1>

          <p className="hero-description">
            A high-throughput, institutional-grade core banking operating system.
            Unified multi-currency ledgers, autonomous KYC/AML anomaly detection, granular role-based permissions, and real-time clearing designed for modern financial institutions.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <Link to="/dashboard" className="hero-btn-primary">
                <span>Enter Banking Terminal ({user?.role?.toUpperCase()})</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/login" className="hero-btn-primary">
                <span>Launch Banking Terminal</span>
                <ArrowRight size={18} />
              </Link>
            )}

            <a href="#demo-roles" className="hero-btn-secondary">
              <Users size={18} />
              <span>Explore Demo Personas</span>
            </a>
          </div>

          <div className="hero-trust-indicators" id="security">
            <div className="trust-item">
              <ShieldCheck size={16} className="trust-icon" />
              <span>SOC2 Type II & Basel III Compliant</span>
            </div>
            <div className="trust-item">
              <Fingerprint size={16} className="trust-icon" />
              <span>Zero-Trust Role Governance</span>
            </div>
            <div className="trust-item">
              <Zap size={16} className="trust-icon" />
              <span>Sub-25ms Ledger Settlement</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Terminal Preview Card */}
        <div className="hero-preview-wrapper">
          <div className="terminal-preview-card glass-panel">
            <div className="terminal-header">
              <div className="terminal-controls">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="terminal-status-bar">
                <Activity size={13} className="terminal-pulse-icon" />
                <span>CENTRAL-LEDGER-NODE #01 • TLS 1.3 STRICT</span>
              </div>
              <div className="terminal-badge">LIVE 99.999%</div>
            </div>

            <div className="terminal-body">
              {/* Live Metric Row */}
              <div className="terminal-kpi-grid">
                <div className="terminal-kpi-card">
                  <span className="kpi-label">TOTAL ASSETS CLEARED</span>
                  <span className="kpi-value">$48,920,400.00</span>
                  <span className="kpi-delta positive">
                    <TrendingUp size={13} /> +12.4% this month
                  </span>
                </div>
                <div className="terminal-kpi-card">
                  <span className="kpi-label">ACTIVE CLIENT ACCOUNTS</span>
                  <span className="kpi-value">12,840</span>
                  <span className="kpi-delta positive">
                    <Users size={13} /> 100% KYC Verified
                  </span>
                </div>
              </div>

              {/* Mock Live Ledger Feed */}
              <div className="terminal-ledger-feed">
                <div className="feed-header">
                  <span>REAL-TIME TRANSACTION STREAM</span>
                  <span className="feed-live-indicator">LIVE FEED</span>
                </div>

                <div className="feed-items">
                  <div className="feed-row">
                    <div className="feed-row-left">
                      <span className="feed-code">TX-94821</span>
                      <span className="feed-type">WIRE TRANSFER</span>
                      <span className="feed-target">Metropolis Corp &rarr; Apex Holdings</span>
                    </div>
                    <div className="feed-row-right">
                      <span className="feed-amount positive">+$125,000.00</span>
                      <span className="feed-badge verified">CLEARED</span>
                    </div>
                  </div>

                  <div className="feed-row">
                    <div className="feed-row-left">
                      <span className="feed-code">TX-94820</span>
                      <span className="feed-type">DISBURSEMENT</span>
                      <span className="feed-target">Commercial Loan #LN-4820</span>
                    </div>
                    <div className="feed-row-right">
                      <span className="feed-amount">-$450,000.00</span>
                      <span className="feed-badge approved">APPROVED</span>
                    </div>
                  </div>

                  <div className="feed-row">
                    <div className="feed-row-left">
                      <span className="feed-code">TX-94819</span>
                      <span className="feed-type">AML CHECK</span>
                      <span className="feed-target">Acct #98412 Velocity Analysis</span>
                    </div>
                    <div className="feed-row-right">
                      <span className="feed-amount neutral">PASS</span>
                      <span className="feed-badge success">SECURE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
