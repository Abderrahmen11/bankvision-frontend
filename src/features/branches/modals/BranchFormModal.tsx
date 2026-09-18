import { showToast } from '@/shared/hooks'
import React, { useState, useEffect } from 'react'
import { X, Building2, Save } from 'lucide-react'
import { branchesApi } from '@/features/branches/api/branches'
import type { CreateBranchPayload, UpdateBranchPayload } from '@/features/branches/api/branches'
import { usersApi } from '@/features/users/api/users'
import type { Branch, User } from '@/shared/types/user'

interface BranchFormModalProps {
  branch?: Branch | null
  onClose: () => void
  onSaved: (branch: Branch) => void
}

interface FormErrors {
  branch_code?: string
  branch_name?: string
  city?: string
  phone?: string
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({ branch, onClose, onSaved }) => {
  const isEdit = !!branch

  const [form, setForm] = useState({
    branch_code: branch?.branch_code ?? '',
    branch_name: branch?.branch_name ?? '',
    address: branch?.address ?? '',
    city: branch?.city ?? '',
    phone: branch?.phone ?? '',
    manager_id: branch?.manager_id ? String(branch.manager_id) : '',
    status: branch?.status ?? 'active',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [managers, setManagers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load manager options (role=manager)
    usersApi
      .list({ role: 'manager', status: 'active', per_page: 100 })
      .then((res) => setManagers(res.data))
      .catch(() => {})
  }, [])

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!form.branch_code.trim()) errs.branch_code = 'Branch code is required.'
    else if (!/^[A-Z0-9-]{2,10}$/.test(form.branch_code.trim()))
      errs.branch_code = 'Code must be 2–10 uppercase alphanumeric characters.'
    if (!form.branch_name.trim()) errs.branch_name = 'Branch name is required.'
    if (form.phone && !/^[+d\s+\-()]{7,20}$/.test(form.phone.trim()))
      errs.phone = 'Enter a valid phone number.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        branch_code: form.branch_code.trim().toUpperCase(),
        branch_name: form.branch_name.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        phone: form.phone.trim() || undefined,
        manager_id: form.manager_id ? Number(form.manager_id) : null,
        status: form.status as 'active' | 'inactive' | 'under_renovation',
      }

      let saved: Branch
      if (isEdit && branch) {
        saved = await branchesApi.update(branch.id, payload as UpdateBranchPayload)
        showToast.success('Branch updated successfully.')
      } else {
        saved = await branchesApi.create(payload as CreateBranchPayload)
        showToast.success('Branch created successfully.')
      }
      onSaved(saved)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save branch.'
      showToast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="br-modal-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Branch' : 'Add Branch'}>
      <div className="br-modal">
        <div className="br-modal-header">
          <span className="br-modal-title">
            <Building2 size={18} />
            {isEdit ? `Edit: ${branch?.branch_name}` : 'Add New Branch'}
          </span>
          <button className="br-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="br-modal-body">
            {/* Row 1: Code + Name */}
            <div className="br-form-row">
              <div className="br-form-field">
                <label className="br-form-label" htmlFor="branch_code">
                  Branch Code <span>*</span>
                </label>
                <input
                  id="branch_code"
                  name="branch_code"
                  className={`br-form-input${errors.branch_code ? ' error' : ''}`}
                  value={form.branch_code}
                  onChange={handleChange}
                  placeholder="e.g. NYC-01"
                  maxLength={10}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.branch_code && (
                  <span className="br-form-error">{errors.branch_code}</span>
                )}
                <span className="br-form-hint">2–10 uppercase alphanumeric</span>
              </div>

              <div className="br-form-field">
                <label className="br-form-label" htmlFor="branch_name">
                  Branch Name <span>*</span>
                </label>
                <input
                  id="branch_name"
                  name="branch_name"
                  className={`br-form-input${errors.branch_name ? ' error' : ''}`}
                  value={form.branch_name}
                  onChange={handleChange}
                  placeholder="e.g. New York Main Branch"
                  maxLength={100}
                />
                {errors.branch_name && (
                  <span className="br-form-error">{errors.branch_name}</span>
                )}
              </div>
            </div>

            {/* Row 2: City + Phone */}
            <div className="br-form-row">
              <div className="br-form-field">
                <label className="br-form-label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  className="br-form-input"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. New York"
                  maxLength={80}
                />
              </div>

              <div className="br-form-field">
                <label className="br-form-label" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  className={`br-form-input${errors.phone ? ' error' : ''}`}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  maxLength={20}
                />
                {errors.phone && <span className="br-form-error">{errors.phone}</span>}
              </div>
            </div>

            {/* Address */}
            <div className="br-form-field">
              <label className="br-form-label" htmlFor="address">
                Street Address
              </label>
              <textarea
                id="address"
                name="address"
                className="br-form-textarea"
                value={form.address}
                onChange={handleChange}
                placeholder="Full street address..."
                rows={2}
                maxLength={255}
              />
            </div>

            {/* Row 3: Manager + Status */}
            <div className="br-form-row">
              <div className="br-form-field">
                <label className="br-form-label" htmlFor="manager_id">
                  Branch Manager
                </label>
                <select
                  id="manager_id"
                  name="manager_id"
                  className="br-form-select"
                  value={form.manager_id}
                  onChange={handleChange}
                >
                  <option value="">- Unassigned -</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="br-form-field">
                <label className="br-form-label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="br-form-select"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_renovation">Under Renovation</option>
                </select>
              </div>
            </div>
          </div>

          <div className="br-modal-footer">
            <button
              type="button"
              className="br-btn br-btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="br-btn br-btn-primary" disabled={saving}>
              <Save size={15} />
              {saving ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
