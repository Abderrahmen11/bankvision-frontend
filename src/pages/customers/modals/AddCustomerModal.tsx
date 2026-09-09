import React, { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { customersApi } from '@/api/customers'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { Branch } from '@/types/user'
import type { CustomerType, KycStatus, RiskLevel } from '@/types/customer'
import { CUSTOMER_TYPE_LABELS } from '../customerHelpers'
import '../CustomerManagement.css'

interface Props {
  branches: Branch[]
  onClose: () => void
  onSuccess: () => void
}

export const AddCustomerModal: React.FC<Props> = ({ branches, onClose, onSuccess }) => {
  const { user: authUser, isAdmin, isManager } = useAuth()

  // Default branch: for Manager and CSR, enforce their assigned branch
  const defaultBranchId =
    !isAdmin && authUser?.branch_id
      ? String(authUser.branch_id)
      : branches[0]?.id
      ? String(branches[0].id)
      : ''

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    customer_type: 'regular' as CustomerType,
    branch_id: defaultBranchId,
    kyc_status: 'pending' as KycStatus,
    risk_level: 'low' as RiskLevel,
    registration_date: new Date().toISOString().split('T')[0],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => {
      const copy = { ...e }
      delete copy[k]
      return copy
    })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.'
    if (!form.email.trim()) errs.email = 'Email address is required.'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    if (!form.branch_id) errs.branch_id = 'Branch assignment is required.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await customersApi.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        customer_type: form.customer_type,
        branch_id: Number(form.branch_id),
        kyc_status: (isAdmin || isManager) ? form.kyc_status : 'pending',
        risk_level: (isAdmin || isManager) ? form.risk_level : 'low',
        registration_date: form.registration_date,
      })

      showToast.success('Customer profile created successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register customer.'
      showToast.error(msg)
      if ((err as { errors?: Record<string, string[]> }).errors) {
        const be = (err as { errors: Record<string, string[]> }).errors
        const mapped: Record<string, string> = {}
        Object.entries(be).forEach(([k, v]) => {
          mapped[k] = v[0]
        })
        setErrors(mapped)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cm-modal cm-modal-lg">
        <div className="cm-modal-header">
          <h2>
            <UserPlus size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Register New Customer
          </h2>
          <button className="cm-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cm-modal-body">
            <div className="cm-form-grid">
              {/* Full Name */}
              <div className="cm-form-group">
                <label className="cm-label">Full Name *</label>
                <input
                  className={`cm-input ${errors.full_name ? 'error' : ''}`}
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  autoFocus
                />
                {errors.full_name && <span className="cm-field-error">{errors.full_name}</span>}
              </div>

              {/* Email */}
              <div className="cm-form-group">
                <label className="cm-label">Email Address *</label>
                <input
                  className={`cm-input ${errors.email ? 'error' : ''}`}
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="eleanor@example.com"
                />
                {errors.email && <span className="cm-field-error">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="cm-form-group">
                <label className="cm-label">Phone Number *</label>
                <input
                  className={`cm-input ${errors.phone ? 'error' : ''}`}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+1-555-0199"
                />
                {errors.phone && <span className="cm-field-error">{errors.phone}</span>}
              </div>

              {/* Customer Type */}
              <div className="cm-form-group">
                <label className="cm-label">Customer Classification *</label>
                <select
                  className="cm-input"
                  value={form.customer_type}
                  onChange={(e) => set('customer_type', e.target.value as CustomerType)}
                >
                  {(['regular', 'premium', 'business'] as CustomerType[]).map((t) => (
                    <option key={t} value={t}>
                      {CUSTOMER_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Assignment */}
              <div className="cm-form-group">
                <label className="cm-label">Branch Assignment *</label>
                <select
                  className={`cm-input ${errors.branch_id ? 'error' : ''}`}
                  value={form.branch_id}
                  onChange={(e) => set('branch_id', e.target.value)}
                  disabled={!isAdmin}
                >
                  <option value="">— Select Branch —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name} ({b.branch_code})
                    </option>
                  ))}
                </select>
                {!isAdmin && (
                  <span className="cm-field-help">Assigned to your operational branch</span>
                )}
                {errors.branch_id && <span className="cm-field-error">{errors.branch_id}</span>}
              </div>

              {/* City */}
              <div className="cm-form-group">
                <label className="cm-label">City</label>
                <input
                  className="cm-input"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Metropolis"
                />
              </div>

              {/* Address (Full Width) */}
              <div className="cm-form-group full-width">
                <label className="cm-label">Street Address</label>
                <input
                  className="cm-input"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="123 Bank Street, Suite 400"
                />
              </div>

              {/* KYC Status (Admin / Manager only) */}
              {(isAdmin || isManager) && (
                <div className="cm-form-group">
                  <label className="cm-label">Initial KYC Status</label>
                  <select
                    className="cm-input"
                    value={form.kyc_status}
                    onChange={(e) => set('kyc_status', e.target.value as KycStatus)}
                  >
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              )}

              {/* Risk Level (Admin / Manager only) */}
              {(isAdmin || isManager) && (
                <div className="cm-form-group">
                  <label className="cm-label">Risk Rating</label>
                  <select
                    className="cm-input"
                    value={form.risk_level}
                    onChange={(e) => set('risk_level', e.target.value as RiskLevel)}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
              )}

              {/* Registration Date (Admin only) */}
              {isAdmin && (
                <div className="cm-form-group">
                  <label className="cm-label">Registration Date</label>
                  <input
                    className="cm-input"
                    type="date"
                    value={form.registration_date}
                    onChange={(e) => set('registration_date', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="cm-modal-footer">
            <button type="button" className="cm-btn cm-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn cm-btn-primary" disabled={loading}>
              {loading ? 'Creating Customer…' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
