import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, UserPlus, Download, RefreshCw, Eye, Pencil,
  Trash2, Users, ShieldCheck, AlertTriangle, DollarSign,
  ChevronUp, ChevronDown, RotateCcw
} from 'lucide-react'
import { customersApi } from '@/api/customers'
import { branchesApi } from '@/api/branches'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { Customer } from '@/types/customer'
import type { Branch } from '@/types/user'
import type { PaginationMeta } from '@/types/api'
import {
  CUSTOMER_TYPE_LABELS,
  KYC_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  formatCurrency,
  getInitials,
  getAvatarColor,
  exportToCSV,
  canCreateCustomer,
  canEditCustomer,
  canDeleteCustomer,
} from './customerHelpers'
import { AddCustomerModal } from './modals/AddCustomerModal'
import { EditCustomerModal } from './modals/EditCustomerModal'
import { DeleteCustomerModal } from './modals/DeleteCustomerModal'
import './CustomerManagement.css'

type SortField = 'registration_date' | 'created_at' | 'full_name' | 'customer_number'

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  // Permissions
  const allowCreate = canCreateCustomer(role)
  const allowEdit   = canEditCustomer(role)
  const allowDelete = canDeleteCustomer(role)

  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [meta, setMeta]           = useState<PaginationMeta | null>(null)
  const [branches, setBranches]   = useState<Branch[]>([])
  const [loading, setLoading]     = useState(true)

  // Filter States
  const [search, setSearch]             = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [kycFilter, setKycFilter]       = useState('')
  const [riskFilter, setRiskFilter]     = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [sortBy, setSortBy]             = useState<SortField>('created_at')
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc')
  const [page, setPage]                 = useState(1)

  // Modals State
  const [showAddModal, setShowAddModal]       = useState(false)
  const [editTarget, setEditTarget]           = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget]       = useState<Customer | null>(null)

  // Load branches
  useEffect(() => {
    branchesApi
      .list({ per_page: 100 })
      .then((res) => setBranches(res.data))
      .catch(() => {})
  }, [])

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await customersApi.list({
        search: search.trim() || undefined,
        customer_type: typeFilter || undefined,
        kyc_status: kycFilter || undefined,
        risk_level: riskFilter || undefined,
        branch_id: branchFilter || undefined,
        sort_by: sortBy,
        sort_direction: sortDir,
        page,
        per_page: 15,
      })
      setCustomers(res.data || [])
      setMeta(res.meta as PaginationMeta)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch customers.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, kycFilter, riskFilter, branchFilter, sortBy, sortDir, page])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('')
    setKycFilter('')
    setRiskFilter('')
    setBranchFilter('')
    setPage(1)
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!customers.length) {
      showToast.error('No customer records to export.')
      return
    }
    const exportData = customers.map((c) => ({
      'Customer ID': c.id,
      'Customer Number': c.customer_number,
      'Full Name': c.full_name,
      'Email': c.email,
      'Phone': c.phone,
      'Classification': CUSTOMER_TYPE_LABELS[c.customer_type] || c.customer_type,
      'KYC Status': c.kyc_status,
      'Risk Level': c.risk_level,
      'Accounts Count': c.accounts_count ?? 0,
      'Total Balance': c.total_balance ?? 0,
      'Branch': c.branch?.branch_name || 'Global',
      'Registration Date': c.registration_date || '',
    }))
    exportToCSV(exportData, `bankvision_customers_${new Date().toISOString().split('T')[0]}`)
    showToast.success('Export downloaded successfully!')
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  // KPI calculations on loaded records
  const totalVerified = customers.filter((c) => c.kyc_status === 'verified').length
  const totalHighRisk = customers.filter((c) => c.risk_level === 'high').length
  const totalPortfolioBalance = customers.reduce((sum, c) => sum + (c.total_balance || 0), 0)

  return (
    <div className="cm-page">
      {/* Page Header */}
      <div className="cm-page-header">
        <div className="cm-page-header-left">
          <h1>Customer Management</h1>
          <p>
            Oversee bank customer profiles, KYC compliance verifications, and financial accounts.
          </p>
        </div>

        <div className="cm-header-actions">
          <button className="cm-btn cm-btn-ghost" onClick={handleExportCSV}>
            <Download size={15} />
            Export CSV
          </button>
          <button
            className="cm-btn cm-btn-ghost"
            onClick={fetchCustomers}
            disabled={loading}
            title="Refresh records"
          >
            <RefreshCw size={15} className={loading ? 'cm-spin' : ''} />
          </button>
          {allowCreate && (
            <button
              className="cm-btn cm-btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={16} />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="cm-stats-row">
        <div className="cm-stat-card">
          <div className="cm-stat-header">
            <span className="cm-stat-label">Total Customers</span>
            <div className="cm-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-400)' }}>
              <Users size={16} />
            </div>
          </div>
          <span className="cm-stat-value">{meta?.total ?? customers.length}</span>
          <span className="cm-stat-sub">Active registry profiles</span>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-header">
            <span className="cm-stat-label">KYC Verified</span>
            <div className="cm-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--emerald-500)' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <span className="cm-stat-value">{totalVerified}</span>
          <span className="cm-stat-sub">Verified in current view</span>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-header">
            <span className="cm-stat-label">High Risk Exposure</span>
            <div className="cm-stat-icon" style={{ background: 'rgba(244, 63, 94, 0.12)', color: 'var(--rose-500)' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <span className="cm-stat-value" style={{ color: totalHighRisk > 0 ? 'var(--rose-500)' : 'inherit' }}>
            {totalHighRisk}
          </span>
          <span className="cm-stat-sub">Requires monitoring</span>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-header">
            <span className="cm-stat-label">Portfolio Balance</span>
            <div className="cm-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--cyan-500)' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <span className="cm-stat-value" style={{ fontSize: '1.35rem' }}>
            {formatCurrency(totalPortfolioBalance)}
          </span>
          <span className="cm-stat-sub">Aggregated in current batch</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cm-filter-card">
        <div className="cm-filter-row">
          <div className="cm-search-wrap">
            <Search size={16} className="cm-search-icon" />
            <input
              className="cm-search-input"
              type="text"
              placeholder="Search by name, email, phone, or customer #…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Customer Type Filter */}
          <select
            className="cm-filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Customer Types</option>
            <option value="regular">Standard Retail</option>
            <option value="premium">Premium Banking</option>
            <option value="business">Commercial Business</option>
          </select>

          {/* KYC Status Filter */}
          <select
            className="cm-filter-select"
            value={kycFilter}
            onChange={(e) => {
              setKycFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All KYC Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Review</option>
            <option value="expired">Expired</option>
          </select>

          {/* Risk Level Filter */}
          <select
            className="cm-filter-select"
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Risk Ratings</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Branch Filter (for roles with bank-wide visibility) */}
          {(role === 'admin' || role === 'compliance' || role === 'auditor' || role === 'analyst') && (
            <select
              className="cm-filter-select"
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name} ({b.branch_code})
                </option>
              ))}
            </select>
          )}

          {(search || typeFilter || kycFilter || riskFilter || branchFilter) && (
            <button
              className="cm-btn cm-btn-ghost"
              onClick={handleResetFilters}
              title="Reset all filters"
              style={{ padding: '0.5rem 0.8rem' }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="cm-table-card">
        <div className="cm-table-wrapper">
          <table className="cm-table">
            <thead>
              <tr>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleSort('full_name')}
                >
                  Customer Name
                  {sortBy === 'full_name' &&
                    (sortDir === 'asc' ? <ChevronUp size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} /> : <ChevronDown size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />)}
                </th>
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
                customers.map((c) => {
                  const kycCfg = KYC_STATUS_CONFIG[c.kyc_status] || KYC_STATUS_CONFIG.pending
                  const riskCfg = RISK_LEVEL_CONFIG[c.risk_level] || RISK_LEVEL_CONFIG.low

                  return (
                    <tr key={c.id}>
                      {/* Customer Info */}
                      <td>
                        <div className="cm-customer-cell">
                          <div
                            className="cm-avatar"
                            style={{ background: getAvatarColor(c.full_name) }}
                          >
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          accounts
                        </span>
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
                          style={{
                            color: kycCfg.color,
                            background: kycCfg.bg,
                            border: `1px solid ${kycCfg.border}`,
                          }}
                        >
                          <span className="cm-badge-dot" />
                          {kycCfg.label}
                        </span>
                      </td>

                      {/* Risk Rating */}
                      <td>
                        <span
                          className="cm-badge"
                          style={{
                            color: riskCfg.color,
                            background: riskCfg.bg,
                            border: `1px solid ${riskCfg.border}`,
                          }}
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
                            <button
                              className="cm-icon-btn"
                              title="Edit Customer"
                              onClick={() => setEditTarget(c)}
                            >
                              <Pencil size={15} />
                            </button>
                          )}

                          {allowDelete && (
                            <button
                              className="cm-icon-btn danger"
                              title="Delete Customer"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta && meta.last_page > 1 && (
          <div className="cm-pagination">
            <span>
              Showing {((page - 1) * meta.per_page) + 1} to{' '}
              {Math.min(page * meta.per_page, meta.total)} of {meta.total} records
            </span>

            <div className="cm-page-controls">
              <button
                className="cm-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, meta.last_page - 4))
                const p = start + i
                return (
                  <button
                    key={p}
                    className={`cm-page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                className="cm-page-btn"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddCustomerModal
          branches={branches}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchCustomers()
          }}
        />
      )}

      {editTarget && (
        <EditCustomerModal
          customer={editTarget}
          branches={branches}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null)
            fetchCustomers()
          }}
        />
      )}

      {deleteTarget && (
        <DeleteCustomerModal
          customer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null)
            fetchCustomers()
          }}
        />
      )}
    </div>
  )
}
