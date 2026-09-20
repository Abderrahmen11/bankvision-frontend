import { showToast } from '@/shared/hooks'
import React, { useState } from 'react'
import { X, UserPlus, Eye, EyeOff } from 'lucide-react'
import { usersApi } from '@/features/users/api/users'
import type { Branch } from '@/shared/types/user'
import { UserFormFields } from '../components/UserFormFields'
import '../pages/UserManagement.css'

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
            <UserFormFields
              mode="add"
              form={form}
              errors={errors}
              branches={branches}
              onChange={set}
              autoFocus
            >
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
            </UserFormFields>
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
