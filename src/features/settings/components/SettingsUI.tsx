import React from 'react'
import { Loader2 } from 'lucide-react'

// ─── Glass Card ──────────────────────────────────────────────────────────────

export interface GlassCardProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export const GlassCard: React.FC<GlassCardProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
  children,
}) => (
  <section className={`st-card ${className}`}>
    {(title || action) && (
      <header className="st-card-header">
        <div className="st-card-heading">
          {icon && <span className="st-card-icon">{icon}</span>}
          <div>
            {title && <h3 className="st-card-title">{title}</h3>}
            {subtitle && <p className="st-card-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="st-card-action">{action}</div>}
      </header>
    )}
    <div className="st-card-body">{children}</div>
  </section>
)

// ─── Toggle Switch ───────────────────────────────────────────────────────────

export interface ToggleSwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label: string
  description?: string
  accent?: string
  id?: string
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  accent = 'var(--primary-500)',
  id,
}) => (
  <div className={`st-toggle-row ${disabled ? 'st-toggle-disabled' : ''}`}>
    <div className="st-toggle-copy">
      <span className="st-toggle-label">{label}</span>
      {description && <span className="st-toggle-desc">{description}</span>}
    </div>
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`st-switch ${checked ? 'on' : ''}`}
      style={checked ? ({ '--switch-accent': accent } as React.CSSProperties) : undefined}
      onClick={() => onChange(!checked)}
    >
      <span className="st-switch-thumb" />
    </button>
  </div>
)

// ─── Form Field ──────────────────────────────────────────────────────────────

export interface FormFieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, hint, error, children }) => (
  <div className="st-field">
    <label className="st-field-label" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {hint && !error && <span className="st-field-hint">{hint}</span>}
    {error && <span className="st-field-error">{error}</span>}
  </div>
)

// ─── Buttons ─────────────────────────────────────────────────────────────────

export interface StButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  loading?: boolean
  icon?: React.ReactNode
}

export const StButton: React.FC<StButtonProps> = ({
  variant = 'primary',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}) => (
  <button
    className={`st-btn st-btn-${variant} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <Loader2 size={15} className="st-spin" /> : icon}
    {children}
  </button>
)

// ─── Status Dot / Pill ───────────────────────────────────────────────────────

export const StatusPill: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const normalized = (status || '').toLowerCase()
  const tone =
    normalized === 'healthy' || normalized === 'active'
      ? 'success'
      : normalized === 'degraded'
        ? 'warning'
        : normalized === 'down'
          ? 'danger'
          : 'neutral'

  return (
    <span className={`st-pill st-pill-${tone}`}>
      <span className="st-pill-dot" />
      {label ?? status}
    </span>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export const StSkeleton: React.FC<{ height?: number; className?: string }> = ({
  height = 120,
  className = '',
}) => <div className={`st-skeleton ${className}`} style={{ height }} />

// ─── Empty State ─────────────────────────────────────────────────────────────

export const StEmpty: React.FC<{ icon?: React.ReactNode; message: string }> = ({ icon, message }) => (
  <div className="st-empty">
    {icon}
    <p>{message}</p>
  </div>
)
