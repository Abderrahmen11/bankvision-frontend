import React from 'react'

export const StatsRibbon: React.FC = () => {
  return (
    <section className="stats-ribbon-section">
      <div className="stats-ribbon-container">
        <div className="stat-box">
          <span className="stat-number">$48.9M+</span>
          <span className="stat-label">Daily Cleared Volume</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-number">&lt; 25ms</span>
          <span className="stat-label">Settlement Latency</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-number">99.999%</span>
          <span className="stat-label">Core Uptime SLA</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-number">6 Personas</span>
          <span className="stat-label">Granular Role Governance</span>
        </div>
      </div>
    </section>
  )
}
