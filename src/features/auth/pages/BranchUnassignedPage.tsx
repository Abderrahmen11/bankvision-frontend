import { useAuth } from '@/shared/hooks'
import React from 'react'
import { Building2, LogOut, RefreshCw } from 'lucide-react'

/**
 * Blocking state for manager/CSR accounts without a branch assignment.
 * The backend's BranchScope::ensure rejects nearly every operation for
 * these roles until an administrator assigns them to a branch, so the
 * app shell is replaced with this notice instead of a wall of 403 toasts.
 */
export const BranchUnassignedPage: React.FC = () => {
  const { user, roleConfig, logout } = useAuth()

  const handleRefresh = () => window.location.reload()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'var(--bg-primary, #0b0f1a)',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
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
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, var(--amber-500, #f59e0b), transparent)',
          }}
        />

        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--amber-500, #f59e0b)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <Building2 size={36} />
        </div>

        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--amber-500, #f59e0b)',
            marginBottom: '0.5rem',
          }}
        >
          Account Configuration Required
        </div>

        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          No Branch Assigned
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.25rem',
          }}
        >
          {roleConfig?.label || user?.role} accounts are scoped to a single branch, and your account has
          not been assigned to one yet. Banking operations stay locked until an administrator completes
          this setup.
        </p>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '1.75rem',
          }}
        >
          Please contact your system administrator, then refresh this page once the assignment is in place.
        </p>

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
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name || 'Staff User'} · {user?.email}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleRefresh}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9375rem',
            }}
          >
            <RefreshCw size={18} />
            <span>Check Again</span>
          </button>

          <button
            type="button"
            onClick={() => logout()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--rose-500)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
