import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  UserCheck,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import { DEMO_PERSONAS, type RolePersona } from '../types'

export const PersonasSection: React.FC = () => {
  const navigate = useNavigate()
  const [selectedPersona, setSelectedPersona] = useState<string>('admin')

  const handleLaunchPersona = (persona: RolePersona) => {
    navigate('/login', {
      state: {
        prefillEmail: persona.email,
        prefillRole: persona.role,
      },
    })
  }

  return (
    <section id="demo-roles" className="personas-section">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="section-pill">EXPERIENCE THE PLATFORM</span>
          <h2 className="section-title">Interactive Quick-Access Demo Personas</h2>
          <p className="section-subtitle">
            Select any institutional role persona below to test the dedicated dashboards, permission boundaries, and operational workflows with 1 click.
          </p>
        </div>

        <div className="personas-interactive-layout">
          <div className="persona-selector-tabs">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.role}
                type="button"
                className={`persona-tab-btn ${selectedPersona === p.role ? 'active' : ''}`}
                onClick={() => setSelectedPersona(p.role)}
              >
                <div
                  className="persona-tab-dot"
                  style={{ backgroundColor: p.color }}
                />
                <div className="persona-tab-text">
                  <span className="persona-tab-title">{p.title}</span>
                  <span className="persona-tab-role">{p.role.toUpperCase()}</span>
                </div>
                <ChevronRight size={16} className="persona-tab-arrow" />
              </button>
            ))}
          </div>

          <div className="persona-detail-card glass-panel">
            {(() => {
              const active =
                DEMO_PERSONAS.find((p) => p.role === selectedPersona) ||
                DEMO_PERSONAS[0]

              return (
                <div className="persona-detail-content">
                  <div className="persona-header-row">
                    <div
                      className="persona-avatar-box"
                      style={{ backgroundColor: active.bg, color: active.color }}
                    >
                      <UserCheck size={32} />
                    </div>
                    <div className="persona-title-group">
                      <div
                        className="persona-badge"
                        style={{ color: active.color, backgroundColor: active.bg }}
                      >
                        {active.role.toUpperCase()} PERSONA
                      </div>
                      <h3 className="persona-name">{active.title}</h3>
                      <span className="persona-email">{active.email}</span>
                    </div>
                  </div>

                  <p className="persona-description-text">{active.description}</p>

                  <div className="persona-scopes-section">
                    <span className="scopes-title">ACCESSIBLE MODULES & AUTHORIZATION:</span>
                    <div className="scopes-grid">
                      {active.features.map((feat) => (
                        <div key={feat} className="scope-item">
                          <CheckCircle2 size={16} style={{ color: active.color }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="persona-launch-footer">
                    <div className="credentials-hint">
                      <span className="hint-label">Default Password:</span>
                      <code className="hint-code">password</code>
                    </div>

                    <button
                      type="button"
                      className="launch-role-btn"
                      style={{
                        background: `linear-gradient(135deg, ${active.color} 0%, var(--primary-600) 100%)`,
                      }}
                      onClick={() => handleLaunchPersona(active)}
                    >
                      <span>Launch as {active.title}</span>
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </section>
  )
}
