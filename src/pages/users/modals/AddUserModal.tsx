import React, { useState } from 'react'
import { X, UserPlus, Eye, EyeOff } from 'lucide-react'
import { usersApi } from '@/api/users'
import { showToast } from '@/hooks/useToast'
import type { Branch } from '@/types/user'
import { ROLE_LABELS } from '../userHelpers'
import '../UserManagement.css'

interface Props {
  branches: Branch[]
  onClose: () => void
  onSuccess: () => void
}

export const AddUserModal: React.FC<Props> = ({ branches, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
    role: 'csr', branch_id: '', status: 'active',
  })
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => { const copy = { ...e }; delete copy[k]; return copy })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim())   errs.name  = 'Full name is required.'
    if (!form.email.trim())  errs.email = 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.'
    if (form.password.length < 8)  errs.password = 'Password must be at least 8 characters.'
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match.'
    if (!form.role) errs.role = 'Role is required.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await usersApi.create({
        name:                  form.name.trim(),
        email:                 form.email.trim(),
        phone:                 form.phone.trim() || undefined,
        password:              form.password,
        password_confirmation: form.password_confirmation,
        role:                  form.role,
        branch_id:             form.branch_id ? Number(form.branch_id) : null,
        status:                form.status,
      })
      showToast.success('Staff member created successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user.'
      showToast.error(msg)
      // If backend returns field-level errors, display them
      if ((err as {errors?: Record<string, string[]>}).errors) {
        const be = (err as {errors: Record<string, string[]>}).errors
        const mapped: Record<string, string> = {}
        Object.entries(be).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="um-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="um-modal um-modal-lg">
        <div className="um-modal-header">
          <h2><UserPlus size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Add New Staff Member</h2>
          <button className="um-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="um-modal-body">
            <div className="um-form-grid">
              {/* Full Name */}
              <div className="um-form-group">
                <label className="um-label">Full Name *</label>
                <input className={`um-input ${errors.name ? 'error' : ''}`}
                  value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="John Doe" autoFocus />
                {errors.name && <span className="um-field-error">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="um-form-group">
                <label className="um-label">Email Address *</label>
                <input className={`um-input ${errors.email ? 'error' : ''}`}
                  type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="john@bankvision.com" />
                {errors.email && <span className="um-field-error">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="um-form-group">
                <label className="um-label">Phone Number</label>
                <input className="um-input" type="tel" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} placeholder="+1-555-0100" />
              </div>

              {/* Role */}
              <div className="um-form-group">
                <label className="um-label">Role *</label>
                <select className={`um-input um-select ${errors.role ? 'error' : ''}`}
                  value={form.role} onChange={(e) => set('role', e.target.value)}
                  style={{ appearance: 'auto' }}>
                  {(['admin','manager','compliance','analyst','csr','auditor'] as const).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                {errors.role && <span className="um-field-error">{errors.role}</span>}
              </div>

              {/* Branch */}
              <div className="um-form-group">
                <label className="um-label">Branch Assignment</label>
                <select className="um-input" value={form.branch_id}
                  onChange={(e) => set('branch_id', e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="">— No Branch —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="um-form-group">
                <label className="um-label">Initial Status</label>
                <select className="um-input" value={form.status}
                  onChange={(e) => set('status', e.target.value)} style={{ appearance: 'auto' }}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Password */}
              <div className="um-form-group">
                <label className="um-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className={`um-input ${errors.password ? 'error' : ''}`}
                    type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{ paddingRight: '2.5rem' }} />
                  <button type="button"
                    style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                    onClick={() => setShowPw((v) => !v)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="um-field-error">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="um-form-group">
                <label className="um-label">Confirm Password *</label>
                <input className={`um-input ${errors.password_confirmation ? 'error' : ''}`}
                  type={showPw ? 'text' : 'password'} value={form.password_confirmation}
                  onChange={(e) => set('password_confirmation', e.target.value)}
                  placeholder="Repeat password" />
                {errors.password_confirmation && (
                  <span className="um-field-error">{errors.password_confirmation}</span>
                )}
              </div>
            </div>
          </div>

          <div className="um-modal-footer">
            <button type="button" className="um-btn um-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="um-btn um-btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
