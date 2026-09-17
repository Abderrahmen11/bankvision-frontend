import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export const CtaBanner: React.FC = () => (
  <section className="lp-section lp-cta-section">
    <div className="lp-section-inner">
      <div className="lp-cta">
        <p className="lp-kicker">
          <span className="lp-kicker-dot" />
          Get started
        </p>
        <h2 className="lp-display lp-display-sm">
          Your bank already has the data. Give it the <em>vision</em>.
        </h2>
        <div className="lp-hero-cta lp-hero-cta-center">
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">
            Sign in to BankVision
            <ArrowRight size={17} />
          </Link>
          <a href="mailto:contact@bankvision.example" className="lp-btn lp-btn-outline lp-btn-lg">
            Talk to us
          </a>
        </div>
        <p className="lp-cta-note">Role-based demo accounts available on the sign-in page.</p>
      </div>
    </div>
  </section>
)
