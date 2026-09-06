import React from 'react'
import { Server, Layers, ShieldCheck } from 'lucide-react'

export const DocsOverviewSection: React.FC = () => {
  return (
    <section id="overview" className="docs-section">
      <span className="section-chapter">CHAPTER 01</span>
      <h1 className="docs-title">Platform Architecture & Technology Stack</h1>
      <p className="docs-lead">
        BankVision is an institutional-grade core banking operating system engineered for reliability, real-time double-entry accounting, automated regulatory AML/KYC screening, and strict role segregation.
      </p>

      <div className="docs-grid-cards">
        <div className="docs-info-card">
          <div className="card-icon primary"><Server size={20} /></div>
          <h4>Backend Core (Laravel 11)</h4>
          <p>RESTful API architecture with granular FormRequest validations, database transactions, Eloquent ORM with strict indexing, and Sanctum token authorization.</p>
        </div>
        <div className="docs-info-card">
          <div className="card-icon cyan"><Layers size={20} /></div>
          <h4>Frontend Client (React 19)</h4>
          <p>Vite 8 build system, client-side routing, Zustand state stores, responsive layouts with desktop mini mode and mobile drawers, and CSS variable theming.</p>
        </div>
        <div className="docs-info-card">
          <div className="card-icon green"><ShieldCheck size={20} /></div>
          <h4>Security & Auditability</h4>
          <p>SOC2 Type II aligned immutable action logs, 256-bit TLS 1.3 encryption, input sanitization, and automated session expiry.</p>
        </div>
      </div>
    </section>
  )
}
