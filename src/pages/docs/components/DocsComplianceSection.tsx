import React from 'react'
import { ShieldAlert, BarChart3 } from 'lucide-react'

export const DocsComplianceSection: React.FC = () => {
  return (
    <section id="compliance" className="docs-section">
      <span className="section-chapter">CHAPTER 06</span>
      <h2 className="docs-section-title">Autonomous AML & KYC Anomaly Detection</h2>
      <p>
        Automated heuristics monitor account activity around the clock to detect structuring, sudden velocity spikes, and sanction violations.
      </p>
      <div className="docs-grid-cards">
        <div className="docs-info-card">
          <div className="card-icon pink"><ShieldAlert size={20} /></div>
          <h4>Velocity Spike Alerts</h4>
          <p>Flags accounts executing &gt;5 transactions in under 10 minutes or exceeding 300% of rolling 30-day average volume.</p>
        </div>
        <div className="docs-info-card">
          <div className="card-icon amber"><BarChart3 size={20} /></div>
          <h4>High-Value Thresholds</h4>
          <p>Automatic Suspicious Activity Report (SAR) generation for transactions meeting federal threshold limits ($10,000+).</p>
        </div>
      </div>
    </section>
  )
}
