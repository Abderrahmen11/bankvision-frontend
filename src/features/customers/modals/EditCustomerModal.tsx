import { showToast, useAuth } from '@/shared/hooks'
import React, { useState, useEffect, useRef } from 'react'
import { X, Pencil, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { customersApi } from '@/features/customers/api/customers'
import { usersApi } from '@/features/users/api/users'
import type { EligibleManager } from '@/features/users/api/users'
import type { Branch } from '@/shared/types/user'
import type { Customer, CustomerType, KycStatus, RiskLevel, UpdateCustomerPayload } from '@/features/customers/types'
import {
  canEditPersonalInfo,
  canEditKyc,
  canEditRisk,
  canChangeBranch,
} from '../customerHelpers'
import { CustomerFormFields } from '../components/CustomerFormFields'
import '../pages/CustomerManagement.css'

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
  const { user: authUser, isAdmin, isManager, isCSR } = useAuth()
  const role = authUser?.role

  const allowPersonal = canEditPersonalInfo(role)
  const allowKyc      = canEditKyc(role)
  const allowRisk     = canEditRisk(role)
  const allowBranch   = canChangeBranch(role)

  // Admin, Manager, and CSR may assign an RM
  const allowRelationshipManager = isAdmin || isManager || isCSR

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
    relationship_manager_id: customer.relationship_manager_id
      ? String(customer.relationship_manager_id)
      : '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Eligible RM state — fetched whenever branch_id changes
  const [eligibleManagers, setEligibleManagers] = useState<EligibleManager[]>([])
  const [rmLoading, setRmLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!form.branch_id || !allowRelationshipManager) {
        setEligibleManagers([])
        return
      }

      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setRmLoading(true)
      usersApi
        .listEligibleRelationshipManagers(form.branch_id)
        .then((managers) => {
          setEligibleManagers(managers)
          // Keep current selection if still valid; otherwise clear it
          setForm((f) => {
            if (f.relationship_manager_id && !managers.some((m) => String(m.id) === f.relationship_manager_id)) {
              return { ...f, relationship_manager_id: '' }
            }
            return f
          })
        })
        .catch(() => {
          setEligibleManagers([])
        })
        .finally(() => setRmLoading(false))
    }, 0)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [form.branch_id, allowRelationshipManager])

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

    if (allowRelationshipManager) {
      payload.relationship_manager_id = form.relationship_manager_id
        ? Number(form.relationship_manager_id)
        : null
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
            Edit Customer Record - {customer.customer_number}
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
                Customer Service Mode: You may update contact and address details, and assign a relationship manager. KYC verification and Risk ratings can only be altered by Compliance Officers or Branch Managers.
              </div>
            )}

            <CustomerFormFields
              mode="edit"
              form={form}
              errors={errors}
              branches={branches}
              onChange={set}
              allowPersonal={allowPersonal}
              allowBranch={allowBranch}
              allowKyc={allowKyc}
              allowRisk={allowRisk}
              allowRelationshipManager={allowRelationshipManager}
              eligibleManagers={eligibleManagers}
              rmLoading={rmLoading}
              autoFocus={allowPersonal}
            />
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
