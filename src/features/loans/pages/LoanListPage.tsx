import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  PlusCircle,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  Edit3,
  RotateCcw,
  TrendingUp,
  ShieldAlert,
  HandCoins,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { loansApi } from '@/api/loans'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { Loan } from '@/types/loan'
import type { PaginationMeta } from '@/types/api'
import {
  LOAN_TYPE_CONFIG,
  LOAN_STATUS_CONFIG,
  formatCurrency,
  formatPercent,
  formatDate,
  calculateRepaymentProgress,
  canApplyLoan,
  canApproveLoan,
  canUpdateLoan,
  isComplianceRole,
  exportToCSV,
} from '../loanHelpers'
import { MobileSortSelect } from '@/shared/components/MobileSortSelect'

import { ApplyLoanModal } from '../modals/ApplyLoanModal'
import { UpdateLoanModal } from '../modals/UpdateLoanModal'
import './LoanManagement.css'

export const LoanListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  // Permissions
  const allowApply = canApplyLoan(role)
  const allowApprove = canApproveLoan(role)
  const allowUpdate = canUpdateLoan(role)
  const isCompliance = isComplianceRole(role)

  // Data
  const [loans, setLoans] = useState<Loan[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<
    'principal_amount' | 'outstanding_balance' | 'interest_rate' | 'next_payment_date' | 'created_at'
  >('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [updateTarget, setUpdateTarget] = useState<Loan | null>(null)

  // Fetch loans
  const fetchLoans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await loansApi.list({
        search: search.trim() || undefined,
        loan_type: typeFilter || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        sort_direction: sortDir,
        page,
        per_page: 15,
      })
      setLoans(res.data || [])
      setMeta(res.meta as PaginationMeta)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch loans.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, sortBy, sortDir, page])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
    setPage(1)
  }

  // Quick Action: Approve
  const handleApprove = async (loan: Loan, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Approve loan application ${loan.loan_number} for ${loan.customer?.full_name}?`)) {
      return
    }
    setActionLoadingId(loan.id)
    try {
      await loansApi.approve(loan.id)
      showToast.success(`Loan ${loan.loan_number} approved and activated!`)
      fetchLoans()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve loan.'
      showToast.error(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!loans.length) {
      showToast.error('No loan records to export.')
      return
    }
    const exportData = loans.map((l) => ({
      'Loan Number': l.loan_number,
      'Customer': l.customer?.full_name || '',
      'Customer #': l.customer?.customer_number || '',
      'Type': l.loan_type,
      'Principal': l.principal_amount,
      'Outstanding': l.outstanding_balance,
      'Interest Rate': `${l.interest_rate}%`,
      'Term (Months)': l.term_months,
      'Status': l.status,
      'Start Date': l.start_date,
      'End Date': l.end_date || '',
      'Next Payment': l.next_payment_date || '',
    }))
    exportToCSV(exportData, `bankvision_loans_${new Date().toISOString().split('T')[0]}`)
    showToast.success('Export downloaded successfully!')
  }

  const toggleSort = (
    field: 'principal_amount' | 'outstanding_balance' | 'interest_rate' | 'next_payment_date'
  ) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
    setPage(1)
  }

  // KPI Calculations
  const totalPrincipal = loans.reduce((acc, l) => acc + (Number(l.principal_amount) || 0), 0)
  const totalOutstanding = loans.reduce((acc, l) => acc + (Number(l.outstanding_balance) || 0), 0)
  const riskLoansCount = loans.filter(
    (l) => l.status === 'delinquent' || l.status === 'defaulted'
  ).length
  const activeCount = loans.filter((l) => l.status === 'active').length

  return (
    <div className="ln-page">
      {/* Header */}
      <div className="ln-page-header">
        <div className="ln-page-header-left">
          <h1>Loan Portfolio Management</h1>
          <p>
            Monitor commercial lending, retail mortgages, payment schedules, and credit risk exposure.
          </p>
        </div>
        <div className="ln-header-actions">
          <button className="ln-btn ln-btn-ghost" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="ln-btn ln-btn-ghost"
            onClick={fetchLoans}
            title="Refresh loans"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'ln-spin' : ''} /> Refresh
          </button>
          {allowApply && (
            <button className="ln-btn ln-btn-primary" onClick={() => setShowApplyModal(true)}>
              <PlusCircle size={15} /> Apply for Loan
            </button>
          )}
        </div>
      </div>

      {/* Compliance Notice Banner */}
      {isCompliance && (
        <div className="ln-compliance-banner">
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Compliance Audit Scope:</strong> In accordance with credit compliance guidelines, your access is
            scoped exclusively to <strong>delinquent</strong> and <strong>defaulted</strong> loan assets.
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="ln-stats-row">
        <div className="ln-stat-card">
          <div className="ln-stat-header">
            <span className="ln-stat-label">Total Facilities</span>
            <div className="ln-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="ln-stat-value">{meta?.total ?? loans.length}</div>
          <div className="ln-stat-sub">{activeCount} actively amortizing</div>
        </div>

        <div className="ln-stat-card">
          <div className="ln-stat-header">
            <span className="ln-stat-label">Committed Principal</span>
            <div className="ln-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <HandCoins size={16} />
            </div>
          </div>
          <div className="ln-stat-value">{formatCurrency(totalPrincipal)}</div>
          <div className="ln-stat-sub">Originated loan capital</div>
        </div>

        <div className="ln-stat-card">
          <div className="ln-stat-header">
            <span className="ln-stat-label">Outstanding Balance</span>
            <div className="ln-stat-icon" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className="ln-stat-value">{formatCurrency(totalOutstanding)}</div>
          <div className="ln-stat-sub">Unpaid principal remaining</div>
        </div>

        <div className="ln-stat-card">
          <div className="ln-stat-header">
            <span className="ln-stat-label">Delinquent / Default Risk</span>
            <div className="ln-stat-icon" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="ln-stat-value" style={{ color: riskLoansCount > 0 ? '#f43f5e' : undefined }}>
            {riskLoansCount}
          </div>
          <div className="ln-stat-sub">Flagged for collections review</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="ln-filter-card">
        <div className="ln-filter-row">
          {/* Search */}
          <div className="ln-search-wrap">
            <Search size={15} className="ln-search-icon" />
            <input
              type="text"
              className="ln-search-input"
              placeholder="Search by loan # or customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Product Type Filter */}
          <select
            className="ln-filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Loan Products</option>
            <option value="personal">Personal Loan</option>
            <option value="mortgage">Mortgage</option>
            <option value="auto">Auto Loan</option>
            <option value="business">Commercial / Business</option>
          </select>

          {/* Status Filter */}
          <select
            className="ln-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="active">Active</option>
            <option value="delinquent">Delinquent</option>
            <option value="defaulted">Defaulted</option>
            <option value="completed">Paid in Full</option>
          </select>

          {/* Reset Filters */}
          <button className="ln-btn ln-btn-ghost" onClick={handleResetFilters} title="Reset all filters">
            <RotateCcw size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Loans Table Card */}
            {/* Mobile sort controls (hidden on desktop) */}
      <MobileSortSelect
        value={sortBy}
        dir={sortDir}
        options={[
          { value: 'created_at', label: 'Sort by Date' },
          { value: 'principal_amount', label: 'Sort by Principal' },
          { value: 'outstanding_balance', label: 'Sort by Outstanding' },
          { value: 'interest_rate', label: 'Sort by Rate' },
          { value: 'next_payment_date', label: 'Sort by Next Payment' },
        ]}
        onField={(v) => { setSortBy(v as typeof sortBy); setPage(1) }}
        onDir={setSortDir}
      />

<div className="ln-table-card">
        <div className="ln-table-wrapper">
          <table className="ln-table">
            <thead>
              <tr>
                <th>Loan Number</th>
                <th>Customer</th>
                <th>Product</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('principal_amount')}>
                  Principal {sortBy === 'principal_amount' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('outstanding_balance')}>
                  Outstanding {sortBy === 'outstanding_balance' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('interest_rate')}>
                  Rate {sortBy === 'interest_rate' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th>Status</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('next_payment_date')}>
                  Next Payment {sortBy === 'next_payment_date' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="ln-loading">
                      <div className="ln-spinner" />
                      <span>Loading loan records...</span>
                    </div>
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="ln-empty">
                      <p>No loans found matching the selected criteria.</p>
                      <button
                        className="ln-btn ln-btn-ghost"
                        style={{ marginTop: 10 }}
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const typeCfg = LOAN_TYPE_CONFIG[loan.loan_type] || LOAN_TYPE_CONFIG.personal
                  const statusCfg = LOAN_STATUS_CONFIG[loan.status] || LOAN_STATUS_CONFIG.active
                  const isDelinquent = loan.status === 'delinquent'
                  const isDefaulted = loan.status === 'defaulted'
                  const isPending = loan.status === 'pending'
                  const progressPct = calculateRepaymentProgress(
                    loan.principal_amount,
                    loan.outstanding_balance
                  )

                  return (
                    <tr
                      key={loan.id}
                      className={
                        isDefaulted
                          ? 'ln-row-defaulted'
                          : isDelinquent
                          ? 'ln-row-delinquent'
                          : ''
                      }
                    >
                      {/* Loan Number & Term */}
                      <td>
                        <div className="ln-num-cell">
                          <div
                            className="ln-type-icon-box"
                            style={{ background: typeCfg.bg, color: typeCfg.color }}
                          >
                            {typeCfg.icon}
                          </div>
                          <div className="ln-num-meta">
                            <span
                              className="ln-num-text"
                              onClick={() => navigate(`/loans/${loan.id}`)}
                            >
                              {loan.loan_number}
                            </span>
                            <span className="ln-num-sub">{loan.term_months} Months Term</span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        {loan.customer ? (
                          <div>
                            <span
                              style={{
                                color: 'var(--primary-400)',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              onClick={() => navigate(`/customers/${loan.customer?.id}`)}
                            >
                              {loan.customer.full_name}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {loan.customer.customer_number}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Customer #{loan.customer_id}</span>
                        )}
                      </td>

                      {/* Product Type */}
                      <td>
                        <span
                          className="ln-badge"
                          style={{
                            background: typeCfg.bg,
                            color: typeCfg.color,
                            border: `1px solid ${typeCfg.border}`,
                          }}
                        >
                          {typeCfg.label}
                        </span>
                      </td>

                      {/* Principal */}
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(loan.principal_amount)}
                        </strong>
                      </td>

                      {/* Outstanding with Progress Bar */}
                      <td>
                        <div className="ln-progress-bar-wrap">
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(loan.outstanding_balance)}
                          </span>
                          <div className="ln-progress-bar">
                            <div
                              className="ln-progress-fill"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="ln-progress-text">
                            <span>{progressPct}% repaid</span>
                          </div>
                        </div>
                      </td>

                      {/* Interest Rate */}
                      <td>
                        <span style={{ fontWeight: 600 }}>{formatPercent(loan.interest_rate)}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="ln-badge"
                          style={{
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            border: `1px solid ${statusCfg.border}`,
                          }}
                        >
                          <span className="ln-badge-dot" />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Next Payment */}
                      <td>
                        <span style={{ fontSize: '0.82rem' }}>
                          {formatDate(loan.next_payment_date)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="ln-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="ln-icon-btn"
                            title="View loan details"
                            onClick={() => navigate(`/loans/${loan.id}`)}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Quick Approve (Admin/Manager when pending) */}
                          {allowApprove && isPending && (
                            <button
                              className="ln-icon-btn approve"
                              title="Approve & Activate Loan"
                              disabled={actionLoadingId === loan.id}
                              onClick={(e) => handleApprove(loan, e)}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}

                          {/* Quick Edit/Update (Admin/Manager) */}
                          {allowUpdate && (
                            <button
                              className="ln-icon-btn edit"
                              title="Update Loan"
                              onClick={() => setUpdateTarget(loan)}
                            >
                              <Edit3 size={14} />
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

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="ln-pagination">
            <span>
              Showing <strong>{(meta.current_page - 1) * meta.per_page + 1}</strong> to{' '}
              <strong>{Math.min(meta.current_page * meta.per_page, meta.total)}</strong> of{' '}
              <strong>{meta.total}</strong> records
            </span>
            <div className="ln-page-controls">
              <button
                className="ln-page-btn"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === meta.last_page ||
                    Math.abs(p - meta.current_page) <= 1
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 4px' }}>…</span>}
                    <button
                      className={`ln-page-btn ${p === meta.current_page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                className="ln-page-btn"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Apply Loan Modal */}
      {showApplyModal && (
        <ApplyLoanModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false)
            fetchLoans()
          }}
        />
      )}

      {/* Update Loan Modal */}
      {updateTarget && (
        <UpdateLoanModal
          loan={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onSuccess={() => {
            setUpdateTarget(null)
            fetchLoans()
          }}
        />
      )}
    </div>
  )
}
