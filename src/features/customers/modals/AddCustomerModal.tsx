import { showToast, useAuth } from '@/shared/hooks'
import React, { useState, useEffect, useRef } from 'react'
import { X, UserPlus } from 'lucide-react'
import { customersApi } from '@/features/customers/api/customers'
import { usersApi } from '@/features/users/api/users'
import type { EligibleManager } from '@/features/users/api/users'
import type { Branch } from '@/shared/types/user'
import type { CustomerType, KycStatus, RiskLevel } from '@/features/customers/types'
import { CustomerFormFields } from '../components/CustomerFormFields'
import '../pages/CustomerManagement.css'

interface Props {
  branches: Branch[]
  onClose: () => void
  onSuccess: () => void
}

export const AddCustomerModal: React.FC<Props> = ({ branches, onClose, onSuccess }) => {
  const { isAdmin, isManager, isCSR, branchId: authBranchId } = useAuth()

  // Admin, Manager, and CSR may assign an RM
  const allowRelationshipManager = isAdmin || isManager || isCSR

  // Default branch: for Manager and CSR, enforce their assigned branch
  const defaultBranchId =
    !isAdmin && authBranchId
      ? String(authBranchId)
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
    relationship_manager_id: '',
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

      // Cancel any in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setRmLoading(true)
      usersApi
        .listEligibleRelationshipManagers(form.branch_id)
        .then((managers) => {
          setEligibleManagers(managers)
          // Reset selected RM if it no longer belongs to the new branch
          setForm((f) => {
            if (f.relationship_manager_id && !managers.some((m) => String(m.id) === f.relationship_manager_id)) {
              return { ...f, relationship_manager_id: '' }
            }
            return f
          })
        })
        .catch(() => {
          // Silently ignore — RM assignment is optional
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
        relationship_manager_id: form.relationship_manager_id
          ? Number(form.relationship_manager_id)
          : null,
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
            <CustomerFormFields
              mode="add"
              form={form}
              errors={errors}
              branches={branches}
              onChange={set}
              allowBranch={isAdmin}
              allowKyc={isAdmin || isManager}
              allowRisk={isAdmin || isManager}
              showAdminControls={isAdmin || isManager}
              allowRelationshipManager={allowRelationshipManager}
              eligibleManagers={eligibleManagers}
              rmLoading={rmLoading}
              autoFocus
            />
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
