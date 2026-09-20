import { showToast } from '@/shared/hooks'
import React, { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { usersApi } from '@/features/users/api/users'
import type { User, Branch } from '@/shared/types/user'
import { UserFormFields } from '../components/UserFormFields'
import '../pages/UserManagement.css'

interface Props {
  user: User
  branches: Branch[]
  onClose: () => void
  onSuccess: () => void
}

export const EditUserModal: React.FC<Props> = ({ user, branches, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'csr',
    branch_id: user.branch?.id ? String(user.branch.id) : '',
    status: user.status || 'active',
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
    if (!form.name.trim()) errs.name = 'Full name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.'
    if (!form.role) errs.role = 'Role is required.'
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
      await usersApi.update(user.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        status: form.status,
      })
      showToast.success('Staff profile updated successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user.'
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
    <div className="um-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="um-modal um-modal-lg">
        <div className="um-modal-header">
          <h2>
            <Pencil size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Edit Staff Member
          </h2>
          <button className="um-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="um-modal-body">
            <UserFormFields
              mode="edit"
              form={form}
              errors={errors}
              branches={branches}
              onChange={set}
              autoFocus
            />
          </div>

          <div className="um-modal-footer">
            <button type="button" className="um-btn um-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="um-btn um-btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
