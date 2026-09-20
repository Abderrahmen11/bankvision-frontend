import React from 'react'
import type { Branch } from '@/shared/types/user'
import { ROLE_LABELS } from '../userHelpers'

interface UserFormValues {
  name: string
  email: string
  phone: string
  role: string
  branch_id: string
  status: string
}

interface UserFormFieldsProps {
  mode: 'add' | 'edit'
  form: UserFormValues
  errors: Record<string, string>
  branches: Branch[]
  onChange: (field: string, value: string) => void
  autoFocus?: boolean
  children?: React.ReactNode
}

const ROLES = ['admin', 'manager', 'compliance', 'analyst', 'csr', 'auditor'] as const

export const UserFormFields: React.FC<UserFormFieldsProps> = ({
  mode,
  form,
  errors,
  branches,
  onChange,
  autoFocus = false,
  children,
}) => (
  <div className="um-form-grid">
    <div className="um-form-group">
      <label className="um-label">Full Name *</label>
      <input
        className={`um-input ${errors.name ? 'error' : ''}`}
        value={form.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="John Doe"
        autoFocus={autoFocus}
      />
      {errors.name && <span className="um-field-error">{errors.name}</span>}
    </div>

    <div className="um-form-group">
      <label className="um-label">Email Address *</label>
      <input
        className={`um-input ${errors.email ? 'error' : ''}`}
        type="email"
        value={form.email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder="john@bankvision.com"
      />
      {errors.email && <span className="um-field-error">{errors.email}</span>}
    </div>

    <div className="um-form-group">
      <label className="um-label">Phone Number</label>
      <input
        className="um-input"
        type="tel"
        value={form.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        placeholder="+1-555-0100"
      />
    </div>

    <div className="um-form-group">
      <label className="um-label">Role *</label>
      <select
        className={`um-input um-select ${errors.role ? 'error' : ''}`}
        value={form.role}
        onChange={(e) => onChange('role', e.target.value)}
        style={{ appearance: 'auto' }}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      {errors.role && <span className="um-field-error">{errors.role}</span>}
    </div>

    <div className="um-form-group">
      <label className="um-label">Branch Assignment</label>
      <select
        className="um-input"
        value={form.branch_id}
        onChange={(e) => onChange('branch_id', e.target.value)}
        style={{ appearance: 'auto' }}
      >
        <option value="">- No Branch -</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.branch_name} ({branch.branch_code})
          </option>
        ))}
      </select>
    </div>

    <div className="um-form-group">
      <label className="um-label">{mode === 'add' ? 'Initial Status' : 'Status'}</label>
      <select
        className="um-input"
        value={form.status}
        onChange={(e) => onChange('status', e.target.value)}
        style={{ appearance: 'auto' }}
      >
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>
    {children}
  </div>
)