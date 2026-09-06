import React from 'react'
import {
  CreditCard,
  ShieldAlert,
  Zap,
  FileSpreadsheet,
  BarChart3,
  Lock,
} from 'lucide-react'

export const CapabilitiesSection: React.FC = () => {
  return (
    <section id="features" className="capabilities-section">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="section-pill">COMPREHENSIVE CAPABILITIES</span>
          <h2 className="section-title">Engineered for High-Stakes Institutional Banking</h2>
          <p className="section-subtitle">
            Every workflow—from front-desk account opening to automated regulatory compliance—is integrated into a single high-performance system.
          </p>
        </div>

        <div className="capabilities-grid">
          <div className="capability-card glass-panel glass-panel-hover">
            <div className="capability-icon-box primary">
              <CreditCard size={24} />
            </div>
            <h3 className="capability-title">Multi-Currency Account Ledger</h3>
            <p className="capability-text">
              Real-time double-entry bookkeeping with immutable ledger balances, multi-tier interest compounding, and automated statement generation.
            </p>
            <div className="capability-tags">
              <span>Double-Entry</span>
              <span>Savings & Checking</span>
              <span>Audit Locks</span>
            </div>
          </div>

          <div className="capability-card glass-panel glass-panel-hover">
            <div className="capability-icon-box pink">
              <ShieldAlert size={24} />
            </div>
            <h3 className="capability-title">Autonomous AML & KYC Intelligence</h3>
            <p className="capability-text">
              Automated risk scoring algorithms detect suspicious transaction velocity, high-risk routing corridors, and PEP sanctions matches in real-time.
            </p>
            <div className="capability-tags">
              <span>Velocity Alerts</span>
              <span>SAR Reporting</span>
              <span>Risk Scoring</span>
            </div>
          </div>

          <div className="capability-card glass-panel glass-panel-hover">
            <div className="capability-icon-box blue">
              <Zap size={24} />
            </div>
            <h3 className="capability-title">High-Throughput Clearing Engine</h3>
            <p className="capability-text">
              Execute wire transfers, internal settlements, and batch payroll disbursements with sub-25ms response times and strict idempotency guarantees.
            </p>
            <div className="capability-tags">
              <span>Sub-25ms Latency</span>
              <span>Idempotent Keys</span>
              <span>Batch Clearing</span>
            </div>
          </div>

          <div className="capability-card glass-panel glass-panel-hover">
            <div className="capability-icon-box amber">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="capability-title">Loan Origination & Servicing</h3>
            <p className="capability-text">
              Complete credit evaluation pipelines, customizable amortization schedules, collateral tracking, and automated default risk categorization.
            </p>
            <div className="capability-tags">
              <span>Amortization</span>
              <span>Collateral Mgmt</span>
              <span>Auto-Disburse</span>
            </div>
          </div>

          <div className="capability-card glass-panel glass-panel-hover">
            <div className="capability-icon-box green">
              <BarChart3 size={24} />
            </div>
            <h3 className="capability-title">Liquidity & Risk Exposure Modeling</h3>
            <p className="capability-text">
              Live branch liquidity monitoring, stress-testing simulators, interest rate sensitivity models, and automated central bank regulatory exports.
            </p>
            <div className="capability-tags">
              <span>Stress Tests</span>
              <span>Liquidity Ratios</span>
              <span>Regulatory Export</span>
            </div>
          </div>

          <div className="capability-card glass-panel glass-panel-hover">
            <div className="capability-icon-box cyan">
              <Lock size={24} />
            </div>
            <h3 className="capability-title">Granular Zero-Trust Governance</h3>
            <p className="capability-text">
              6 pre-configured institutional role personas with field-level authorization, dual-approval requirements, and tamper-proof action logs.
            </p>
            <div className="capability-tags">
              <span>Role Guards</span>
              <span>Maker-Checker</span>
              <span>Action Trails</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
