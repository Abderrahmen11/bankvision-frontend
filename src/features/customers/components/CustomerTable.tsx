import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Pencil, Trash2, ChevronUp, ChevronDown,
  AlertTriangle, Users, RefreshCw,
} from 'lucide-react'
import type { Customer } from '@/features/customers/types'
import type { PaginationMeta } from '@/shared/types/api'
import {
  CUSTOMER_TYPE_LABELS,
  KYC_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  formatCurrency,
  getInitials,
  getAvatarColor,
} from '../customerHelpers'

type SortField = 'registration_date' | 'created_at' | 'full_name' | 'customer_number'

interface CustomerTableProps {
  customers: Customer[]
  loading: boolean
  error: Error | null
  sortBy: SortField
  sortDir: 'asc' | 'desc'
  onToggleSort: (field: SortField) => void
  onRetry: () => void
  // Permissions
  allowEdit: boolean
  allowDelete: boolean
  // Row actions
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  // Pagination
  meta: PaginationMeta | null
  page: number
  onPageChange: (page: number) => void
}

/** Sortable column header */
const SortHeader: React.FC<{
  field: SortField
  label: string
  sortBy: SortField
  sortDir: 'asc' | 'desc'
  onToggle: (field: SortField) => void
}> = ({ field, label, sortBy, sortDir, onToggle }) => (
  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggle(field)}>
    {label}
    {sortBy === field && (
      sortDir === 'asc'
        ? <ChevronUp size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
        : <ChevronDown size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
    )}
  </th>
)

/** Single table row */
const CustomerRow: React.FC<{
  customer: Customer
  allowEdit: boolean
  allowDelete: boolean
  onEdit: (c: Customer) => void
  onDelete: (c: Customer) => void
}> = ({ customer: c, allowEdit, allowDelete, onEdit, onDelete }) => {
  const navigate = useNavigate()
  const kycCfg  = KYC_STATUS_CONFIG[c.kyc_status]  || KYC_STATUS_CONFIG.pending
  const riskCfg = RISK_LEVEL_CONFIG[c.risk_level]  || RISK_LEVEL_CONFIG.low

  return (
    <tr key={c.id}>
      {/* Customer Info */}
      <td>
        <div className="cm-customer-cell">
          <div className="cm-avatar" style={{ background: getAvatarColor(c.full_name) }}>
            {getInitials(c.full_name)}
          </div>
          <div className="cm-customer-meta">
            <span
              className="cm-customer-name"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/customers/${c.id}`)}
            >
              {c.full_name}
            </span>
            <span className="cm-customer-sub">
              <code>{c.customer_number}</code> • {c.email}
            </span>
          </div>
        </div>
      </td>

      {/* Type Badge */}
      <td>
        <span className={`cm-badge-type ${c.customer_type}`}>
          {CUSTOMER_TYPE_LABELS[c.customer_type] || c.customer_type}
        </span>
      </td>

      {/* Accounts Count */}
      <td>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {c.accounts_count ?? 0}
        </span>{' '}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>accounts</span>
      </td>

      {/* Total Balance */}
      <td>
        <span style={{ fontWeight: 700, color: (c.total_balance || 0) > 0 ? 'var(--emerald-500)' : 'var(--text-primary)' }}>
          {formatCurrency(c.total_balance)}
        </span>
      </td>

      {/* KYC Status */}
      <td>
        <span
          className="cm-badge"
          style={{ color: kycCfg.color, background: kycCfg.bg, border: `1px solid ${kycCfg.border}` }}
        >
          <span className="cm-badge-dot" />
          {kycCfg.label}
        </span>
      </td>

      {/* Risk Rating */}
      <td>
        <span
          className="cm-badge"
          style={{ color: riskCfg.color, background: riskCfg.bg, border: `1px solid ${riskCfg.border}` }}
        >
          {riskCfg.label}
        </span>
      </td>

      {/* Branch */}
      <td>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {c.branch?.branch_name || 'Global'}
        </span>
      </td>

      {/* Actions */}
      <td style={{ textAlign: 'right' }}>
        <div className="cm-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            className="cm-icon-btn"
            title="View Customer Profile"
            onClick={() => navigate(`/customers/${c.id}`)}
          >
            <Eye size={15} />
          </button>

          {allowEdit && (
            <button className="cm-icon-btn" title="Edit Customer" onClick={() => onEdit(c)}>
              <Pencil size={15} />
            </button>
          )}

          {allowDelete && (
            <button className="cm-icon-btn danger" title="Delete Customer" onClick={() => onDelete(c)}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

/** Pagination controls */
const TablePagination: React.FC<{
  meta: PaginationMeta
  page: number
  onPageChange: (p: number) => void
}> = ({ meta, page, onPageChange }) => {
  const start = Math.max(1, Math.min(page - 2, meta.last_page - 4))

  return (
    <div className="cm-pagination">
      <span>
        Showing {((page - 1) * meta.per_page) + 1} to{' '}
        {Math.min(page * meta.per_page, meta.total)} of {meta.total} records
      </span>
      <div className="cm-page-controls">
        <button className="cm-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ← Prev
        </button>
        {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
          const p = start + i
          return (
            <button
              key={p}
              className={`cm-page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        })}
        <button className="cm-page-btn" disabled={page >= meta.last_page} onClick={() => onPageChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  )
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  error,
  sortBy,
  sortDir,
  onToggleSort,
  onRetry,
  allowEdit,
  allowDelete,
  onEdit,
  onDelete,
  meta,
  page,
  onPageChange,
}) => {
  return (
    <div className="cm-table-card">
      <div className="cm-table-wrapper">
        <table className="cm-table">
          <thead>
            <tr>
              <SortHeader field="full_name" label="Customer Name" sortBy={sortBy} sortDir={sortDir} onToggle={onToggleSort} />
              <th>Classification</th>
              <th>Accounts</th>
              <th>Total Balance</th>
              <th>KYC Status</th>
              <th>Risk Rating</th>
              <th>Branch</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="cm-loading">
                    <div className="cm-spinner" />
                    <span>Loading customer directory…</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8}>
                  <div className="cm-empty" style={{ color: 'var(--danger-500, #ef4444)' }}>
                    <AlertTriangle size={36} />
                    <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>
                      {error.message || 'Failed to load customer directory.'}
                    </p>
                    <button
                      type="button"
                      className="cm-btn cm-btn-secondary"
                      onClick={onRetry}
                      style={{ marginTop: '0.75rem' }}
                    >
                      <RefreshCw size={14} style={{ marginRight: 6 }} />
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="cm-empty">
                    <Users size={36} color="var(--text-muted)" />
                    <p>No customer profiles found matching criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <CustomerRow
                  key={c.id}
                  customer={c}
                  allowEdit={allowEdit}
                  allowDelete={allowDelete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <TablePagination meta={meta} page={page} onPageChange={onPageChange} />
      )}
    </div>
  )
}
