import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export const CtaBanner: React.FC = () => {
  return (
    <section className="cta-banner-section">
      <div className="cta-banner-container glass-panel">
        <div className="cta-banner-content">
          <h2 className="cta-banner-title">Ready to Experience BankVision Core?</h2>
          <p className="cta-banner-text">
            Launch the system right now, switch between 6 institutional staff roles, and explore live operational workflows.
          </p>
          <div className="cta-banner-buttons">
            <Link to="/login" className="cta-button primary-pill large">
              <span>Access Staff Portal</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
