import { useAuth } from '@/shared/hooks'
import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Compass, ArrowLeft, Home, LogIn } from 'lucide-react'
import './NotFoundPage.css'

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <main className="not-found-root">
      <div className="not-found-card">
        {/* Ambient Top Glow */}
        <div className="not-found-top-glow" aria-hidden="true" />

        {/* Icon */}
        <div className="not-found-icon" aria-hidden="true">
          <Compass size={36} />
        </div>

        {/* Status Code */}
        <div className="not-found-code" aria-hidden="true">
          404
        </div>

        {/* Status Code & Header */}
        <p className="not-found-eyebrow">HTTP 404 - Route Not Found</p>

        <h1 className="not-found-title">Page Not Found</h1>

        <p className="not-found-description">
          The route you requested does not exist or may have been moved.
          BankVision keeps unmapped addresses off the books — use the actions below to get back on track.
        </p>

        {/* Attempted Route Banner */}
        <div className="not-found-path">
          <span>Requested:</span>
          <span className="not-found-path-value">{location.pathname}</span>
        </div>

        {/* Navigation CTAs */}
        <div className="not-found-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="not-found-btn not-found-btn-primary">
              <Home size={18} />
              <span>Return to My Dashboard</span>
            </Link>
          ) : (
            <Link to="/" className="not-found-btn not-found-btn-primary">
              <Home size={18} />
              <span>Back to Home</span>
            </Link>
          )}

          <div className="not-found-actions-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="not-found-btn not-found-btn-secondary"
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>

            {!isAuthenticated && (
              <Link to="/login" className="not-found-btn not-found-btn-secondary">
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
