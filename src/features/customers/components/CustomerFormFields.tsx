import React from 'react'
import type { Branch } from '@/shared/types/user'
import type { CustomerType, KycStatus, RiskLevel } from '@/features/customers/types'
import type { EligibleManager } from '@/features/users/api/users'
import { CUSTOMER_TYPE_LABELS } from '../customerHelpers'

interface CustomerFormValues {
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  customer_type: CustomerType
  branch_id: string
  kyc_status: KycStatus
  risk_level: RiskLevel
  registration_date?: string
  relationship_manager_id?: string
}

interface CustomerFormFieldsProps {
  mode: 'add' | 'edit'
  form: CustomerFormValues
  errors: Record<string, string>
  branches: Branch[]
  onChange: (field: string, value: string) => void
  allowPersonal?: boolean
  allowBranch: boolean
  allowKyc: boolean
  allowRisk: boolean
  showAdminControls?: boolean
  autoFocus?: boolean
  /** Eligible RMs for the currently selected branch (undefined = still loading / not applicable) */
  eligibleManagers?: EligibleManager[]
  /** Whether the RM picker should be shown */
  allowRelationshipManager?: boolean
  rmLoading?: boolean
}

export const CustomerFormFields: React.FC<CustomerFormFieldsProps> = ({
  mode,
  form,
  errors,
  branches,
  onChange,
  allowPersonal = true,
  allowBranch,
  allowKyc,
  allowRisk,
  showAdminControls = false,
  autoFocus = false,
  eligibleManagers,
  allowRelationshipManager = false,
  rmLoading = false,
}) => (
  <div className="cm-form-grid">
    <div className="cm-form-group">
      <label className="cm-label">Full Name *</label>
      <input
        className={`cm-input ${errors.full_name ? 'error' : ''}`}
        value={form.full_name}
        onChange={(e) => onChange('full_name', e.target.value)}
        placeholder={mode === 'add' ? 'e.g. Eleanor Vance' : undefined}
        disabled={!allowPersonal}
        autoFocus={autoFocus}
      />
      {errors.full_name && <span className="cm-field-error">{errors.full_name}</span>}
    </div>

    <div className="cm-form-group">
      <label className="cm-label">Email Address *</label>
      <input
        className={`cm-input ${errors.email ? 'error' : ''}`}
        type="email"
        value={form.email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder={mode === 'add' ? 'eleanor@example.com' : undefined}
        disabled={!allowPersonal}
      />
      {errors.email && <span className="cm-field-error">{errors.email}</span>}
    </div>

    <div className="cm-form-group">
      <label className="cm-label">Phone Number *</label>
      <input
        className={`cm-input ${errors.phone ? 'error' : ''}`}
        type="tel"
        value={form.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        placeholder={mode === 'add' ? '+1-555-0199' : undefined}
        disabled={!allowPersonal}
      />
      {errors.phone && <span className="cm-field-error">{errors.phone}</span>}
    </div>

    <div className="cm-form-group">
      <label className="cm-label">
        Customer Classification{mode === 'add' ? ' *' : ''}
      </label>
      <select
        className="cm-input"
        value={form.customer_type}
        onChange={(e) => onChange('customer_type', e.target.value)}
        disabled={!allowPersonal}
      >
        {(['regular', 'premium', 'business'] as CustomerType[]).map((type) => (
          <option key={type} value={type}>
            {CUSTOMER_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>

    <div className="cm-form-group">
      <label className="cm-label">{mode === 'add' ? 'Branch Assignment *' : 'Branch'}</label>
      <select
        className={`cm-input ${errors.branch_id ? 'error' : ''}`}
        value={form.branch_id}
        onChange={(e) => onChange('branch_id', e.target.value)}
        disabled={!allowBranch}
      >
        <option value="">{mode === 'add' ? '- Select Branch -' : '- No Branch -'}</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.branch_name} ({branch.branch_code})
          </option>
        ))}
      </select>
      {!allowBranch && (
        <span className="cm-field-help">
          {mode === 'add'
            ? 'Assigned to your operational branch'
            : 'Branch assignment fixed by operational jurisdiction'}
        </span>
      )}
      {errors.branch_id && <span className="cm-field-error">{errors.branch_id}</span>}
    </div>

    <div className="cm-form-group">
      <label className="cm-label">City</label>
      <input
        className="cm-input"
        value={form.city}
        onChange={(e) => onChange('city', e.target.value)}
        placeholder={mode === 'add' ? 'Metropolis' : undefined}
        disabled={!allowPersonal}
      />
    </div>

    <div className="cm-form-group full-width">
      <label className="cm-label">Street Address</label>
      <input
        className="cm-input"
        value={form.address}
        onChange={(e) => onChange('address', e.target.value)}
        placeholder={mode === 'add' ? '123 Bank Street, Suite 400' : undefined}
        disabled={!allowPersonal}
      />
    </div>

    {/* Relationship Manager picker — shown when the caller has permission */}
    {allowRelationshipManager && (
      <div className="cm-form-group">
        <label className="cm-label">Relationship Manager</label>
        <select
          className={`cm-input ${errors.relationship_manager_id ? 'error' : ''}`}
          value={form.relationship_manager_id ?? ''}
          onChange={(e) => onChange('relationship_manager_id', e.target.value)}
          disabled={rmLoading || !form.branch_id}
        >
          <option value="">— Unassigned —</option>
          {rmLoading ? (
            <option disabled>Loading…</option>
          ) : (
            (eligibleManagers ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))
          )}
        </select>
        {!form.branch_id && (
          <span className="cm-field-help">Select a branch first to load eligible managers</span>
        )}
        {errors.relationship_manager_id && (
          <span className="cm-field-error">{errors.relationship_manager_id}</span>
        )}
      </div>
    )}

    {(mode === 'edit' || showAdminControls) && (
      <div className="cm-form-group">
        <label className="cm-label">{mode === 'add' ? 'Initial KYC Status' : 'KYC Verification Status'}</label>
        <select
          className="cm-input"
          value={form.kyc_status}
          onChange={(e) => onChange('kyc_status', e.target.value)}
          disabled={!allowKyc}
        >
          <option value="pending">Pending Review</option>
          <option value="verified">Verified</option>
          <option value="expired">Expired</option>
        </select>
        {mode === 'edit' && !allowKyc && (
          <span className="cm-field-help">Requires Compliance Officer or Manager clearance</span>
        )}
      </div>
    )}

    {(mode === 'edit' || showAdminControls) && (
      <div className="cm-form-group">
        <label className="cm-label">Risk Rating</label>
        <select
          className="cm-input"
          value={form.risk_level}
          onChange={(e) => onChange('risk_level', e.target.value)}
          disabled={!allowRisk}
        >
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
        {mode === 'edit' && !allowRisk && (
          <span className="cm-field-help">Risk level controlled by Branch Management</span>
        )}
      </div>
    )}

    {mode === 'add' && showAdminControls && (
      <div className="cm-form-group">
        <label className="cm-label">Registration Date</label>
        <input
          className="cm-input"
          type="date"
          value={form.registration_date ?? ''}
          onChange={(e) => onChange('registration_date', e.target.value)}
        />
      </div>
    )}
  </div>
)