import { useAuth } from '@/shared/hooks'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home, BookOpen, LogOut } from 'lucide-react'

export const UnauthorizedPage: React.FC = () => {
  const { user, roleConfig, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '540px',
          width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, var(--rose-500), transparent)',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '16px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--rose-500)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        {/* Status Code & Header */}
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--rose-500)',
            marginBottom: '0.5rem',
          }}
        >
          HTTP 403 - Access Forbidden
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Permission Denied
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
          }}
        >
          Your current security clearance does not grant access to this module or route.
          BankVision enforces strict isolation between banking operations.
        </p>

        {/* Current Credentials Banner */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.875rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Current Session:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name || 'Staff User'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                color: roleConfig?.badgeColor || 'var(--primary-400)',
                backgroundColor: roleConfig?.badgeBg || 'rgba(99, 102, 241, 0.15)',
              }}
            >
              {roleConfig?.label || user?.role}
            </span>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9375rem',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            <Home size={18} />
            <span>Return to My Dashboard</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>

            <Link
              to="/docs"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <BookOpen size={16} />
              <span>RBAC Docs</span>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--rose-500)',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
