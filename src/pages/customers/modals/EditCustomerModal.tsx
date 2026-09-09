import React, { useState } from 'react'
import { X, Pencil, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { customersApi } from '@/api/customers'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { Branch } from '@/types/user'
import type { Customer, CustomerType, KycStatus, RiskLevel, UpdateCustomerPayload } from '@/types/customer'
import {
  CUSTOMER_TYPE_LABELS,
  canEditPersonalInfo,
  canEditKyc,
  canEditRisk,
  canChangeBranch,
} from '../customerHelpers'
import '../CustomerManagement.css'

interface Props {
  customer: Customer
  branches: Branch[]
  onClose: () => void
  onSuccess: () => void
}

export const EditCustomerModal: React.FC<Props> = ({
  customer,
  branches,
  onClose,
  onSuccess,
}) => {
  const { user: authUser } = useAuth()
  const role = authUser?.role

  const allowPersonal = canEditPersonalInfo(role)
  const allowKyc      = canEditKyc(role)
  const allowRisk     = canEditRisk(role)
  const allowBranch   = canChangeBranch(role)

  const [form, setForm] = useState({
    full_name: customer.full_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    customer_type: (customer.customer_type || 'regular') as CustomerType,
    branch_id: customer.branch_id ? String(customer.branch_id) : '',
    kyc_status: (customer.kyc_status || 'pending') as KycStatus,
    risk_level: (customer.risk_level || 'low') as RiskLevel,
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
    if (allowPersonal) {
      if (!form.full_name.trim()) errs.full_name = 'Full name is required.'
      if (!form.email.trim()) errs.email = 'Email address is required.'
      if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.'
      if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    const payload: UpdateCustomerPayload = {}

    // Only attach permitted fields according to RBAC
    if (allowPersonal) {
      payload.full_name = form.full_name.trim()
      payload.email = form.email.trim()
      payload.phone = form.phone.trim()
      payload.address = form.address.trim() || undefined
      payload.city = form.city.trim() || undefined
      payload.customer_type = form.customer_type
    }

    if (allowBranch && form.branch_id) {
      payload.branch_id = Number(form.branch_id)
    }

    if (allowKyc) {
      payload.kyc_status = form.kyc_status
    }

    if (allowRisk) {
      payload.risk_level = form.risk_level
    }

    setLoading(true)
    try {
      await customersApi.update(customer.id, payload)
      showToast.success('Customer details updated successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update customer.'
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
            <Pencil size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Edit Customer Record — {customer.customer_number}
          </h2>
          <button className="cm-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cm-modal-body">
            {/* Contextual notice for Compliance */}
            {role === 'compliance' && (
              <div className="cm-info-box">
                <ShieldAlert size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Compliance Mode: You may review and update the customer's <strong>KYC verification status</strong> and <strong>risk rating</strong>. Personal contact records are read-only.
              </div>
            )}

            {/* Contextual notice for CSR */}
            {role === 'csr' && (
              <div className="cm-info-box">
                <CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Customer Service Mode: You may update contact and address details. KYC verification and Risk ratings can only be altered by Compliance Officers or Branch Managers.
              </div>
            )}

            <div className="cm-form-grid">
              {/* Full Name */}
              <div className="cm-form-group">
                <label className="cm-label">Full Name *</label>
                <input
                  className={`cm-input ${errors.full_name ? 'error' : ''}`}
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  disabled={!allowPersonal}
                  autoFocus={allowPersonal}
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
                  disabled={!allowPersonal}
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
                  disabled={!allowPersonal}
                />
                {errors.phone && <span className="cm-field-error">{errors.phone}</span>}
              </div>

              {/* Customer Type */}
              <div className="cm-form-group">
                <label className="cm-label">Customer Classification</label>
                <select
                  className="cm-input"
                  value={form.customer_type}
                  onChange={(e) => set('customer_type', e.target.value as CustomerType)}
                  disabled={!allowPersonal}
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
                <label className="cm-label">Branch</label>
                <select
                  className="cm-input"
                  value={form.branch_id}
                  onChange={(e) => set('branch_id', e.target.value)}
                  disabled={!allowBranch}
                >
                  <option value="">— No Branch —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name} ({b.branch_code})
                    </option>
                  ))}
                </select>
                {!allowBranch && (
                  <span className="cm-field-help">Branch assignment fixed by operational jurisdiction</span>
                )}
              </div>

              {/* City */}
              <div className="cm-form-group">
                <label className="cm-label">City</label>
                <input
                  className="cm-input"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  disabled={!allowPersonal}
                />
              </div>

              {/* Address (Full Width) */}
              <div className="cm-form-group full-width">
                <label className="cm-label">Street Address</label>
                <input
                  className="cm-input"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  disabled={!allowPersonal}
                />
              </div>

              {/* KYC Status */}
              <div className="cm-form-group">
                <label className="cm-label">KYC Verification Status</label>
                <select
                  className="cm-input"
                  value={form.kyc_status}
                  onChange={(e) => set('kyc_status', e.target.value as KycStatus)}
                  disabled={!allowKyc}
                >
                  <option value="pending">Pending Review</option>
                  <option value="verified">Verified</option>
                  <option value="expired">Expired</option>
                </select>
                {!allowKyc && (
                  <span className="cm-field-help">Requires Compliance Officer or Manager clearance</span>
                )}
              </div>

              {/* Risk Level */}
              <div className="cm-form-group">
                <label className="cm-label">Risk Rating</label>
                <select
                  className="cm-input"
                  value={form.risk_level}
                  onChange={(e) => set('risk_level', e.target.value as RiskLevel)}
                  disabled={!allowRisk}
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
                {!allowRisk && (
                  <span className="cm-field-help">Risk level controlled by Branch Management</span>
                )}
              </div>
            </div>
          </div>

          <div className="cm-modal-footer">
            <button type="button" className="cm-btn cm-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cm-btn cm-btn-primary" disabled={loading}>
              {loading ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
