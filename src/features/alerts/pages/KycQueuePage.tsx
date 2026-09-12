import { useAuth } from '@/shared/hooks'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  UserCheck,
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building2,
  FileCheck,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react'
import { customersApi } from '@/features/customers/api/customers'
import { branchesApi } from '@/features/branches/api/branches'
import type { Customer, CustomerListParams } from '@/features/customers/types'
import type { Branch } from '@/shared/types/user'
import { AlertNavTabs } from '../components/AlertNavTabs'
import { UploadDocumentModal } from '../modals/UploadDocumentModal'
import './AlertManagement.css'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export const KycQueuePage: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'csr'

  const [customers, setCustomers] = useState<Customer[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [kycStatus, setKycStatus] = useState<string>('pending')
  const [riskLevel, setRiskLevel] = useState<string>('')
  const [branchId, setBranchId] = useState<string>('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  // Quick Action / Modal States
  const [uploadCustomer, setUploadCustomer] = useState<Customer | null>(null)
  const [confirmCustomer, setConfirmCustomer] = useState<{
    customer: Customer
    action: 'verify' | 'reject'
  } | null>(null)
  const [processingAction, setProcessingAction] = useState(false)

  // KPI Stats
  const [kpiStats, setKpiStats] = useState({
    pending: 0,
    expired: 0,
    highRisk: 0,
    verified: 0,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load branches
  useEffect(() => {
    branchesApi
      .list()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? [])
        setBranches(list)
      })
      .catch(() => {})
  }, [])

  const fetchKycQueue = useCallback(
    async (params: CustomerListParams) => {
      setLoading(true)
      setError(null)
      try {
        const res = await customersApi.list(params)
        const data = (res as any).data ?? []
        const m = (res as any).meta ?? null
        setCustomers(Array.isArray(data) ? data : [])
        setMeta(m)

        // Compute local KPI counts
        const all = Array.isArray(data) ? data : []
        setKpiStats({
          pending: all.filter((c: Customer) => c.kyc_status === 'pending').length,
          expired: all.filter((c: Customer) => c.kyc_status === 'expired').length,
          highRisk: all.filter((c: Customer) => c.risk_level === 'high').length,
          verified: all.filter((c: Customer) => c.kyc_status === 'verified').length,
        })
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load KYC verification queue.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchKycQueue({
        search: search || undefined,
        kyc_status: kycStatus || undefined,
        risk_level: riskLevel || undefined,
        branch_id: branchId || undefined,
        page,
        per_page: PER_PAGE,
      })
    }, 380)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, kycStatus, riskLevel, branchId, page, fetchKycQueue])

  const handleReset = () => {
    setSearch('')
    setKycStatus('')
    setRiskLevel('')
    setBranchId('')
    setPage(1)
  }

  // Export to CSV
  const handleExport = () => {
    const headers = [
      'Customer Number',
      'Full Name',
      'Email',
      'Phone',
      'Branch',
      'KYC Status',
      'Risk Level',
      'Customer Type',
      'Registration Date',
    ]

    const rows = customers.map((c) => [
      c.customer_number,
      `"${(c.full_name ?? '').replace(/"/g, '""')}"`,
      c.email ?? '',
      c.phone ?? '',
      c.branch?.branch_name ?? '',
      c.kyc_status ?? '',
      c.risk_level ?? '',
      c.customer_type ?? '',
      c.created_at ?? '',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kyc-queue-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast('KYC Queue exported to CSV.')
  }

  // Quick verify/reject execution
  const executeCustomerAction = async () => {
    if (!confirmCustomer) return
    const { customer, action } = confirmCustomer
    setProcessingAction(true)
    try {
      const targetStatus = action === 'verify' ? 'verified' : 'expired'
      const updated = await customersApi.update(customer.id, {
        kyc_status: targetStatus as any,
      })
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      showToast(
        action === 'verify'
          ? `KYC verified and approved for ${customer.full_name}.`
          : `KYC marked as Expired / Rejected for ${customer.full_name}.`
      )
      setConfirmCustomer(null)
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ??
          err?.message ??
          `Failed to ${action} customer KYC.`,
        'error'
      )
    } finally {
      setProcessingAction(false)
    }
  }

  const handleDocumentVerified = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    )
    setUploadCustomer(null)
    showToast(`KYC document verified & approved for ${updatedCustomer.full_name}!`)
  }

  const canVerify = ['admin', 'compliance', 'manager'].includes(role)
  const totalPages = meta?.last_page ?? 1

  return (
    <div className="al-page">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 24,
            zIndex: 99999,
            padding: '12px 20px',
            borderRadius: 10,
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toast.type === 'success' ? <CheckCheck size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="al-header">
        <div className="al-header-left">
          <h1 className="al-title">
            <UserCheck
              size={22}
              style={{ verticalAlign: 'middle', marginRight: 8, color: '#38bdf8' }}
            />
            KYC Verification Queue
          </h1>
          <p className="al-subtitle">
            Review customer identity documents, verify compliance status, and manage renewals.
          </p>
        </div>
        <div className="al-header-actions">
          <button
            className="al-btn al-btn-ghost"
            onClick={() => fetchKycQueue({ page, per_page: PER_PAGE })}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            className="al-btn al-btn-secondary"
            onClick={handleExport}
            disabled={customers.length === 0}
          >
            <Download size={15} />
            Export Queue
          </button>
        </div>
      </div>

      {/* Navigation Tabs for Alerts / KYC / AML */}
      <AlertNavTabs />

      {/* Role Notice */}
      {role === 'csr' && (
        <div className="al-role-banner info">
          <Info size={15} />
          Viewing customer KYC profiles for your branch only. Verification &amp; rejection require
          Compliance or Branch Manager authorization.
        </div>
      )}

      {/* KPI Cards */}
      <div className="al-stats-grid">
        <div className="al-stat-card" style={{ '--card-accent': '#f59e0b' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            <Clock size={20} />
          </div>
          <span className="al-stat-label">Pending Verification</span>
          <span className="al-stat-value">{kpiStats.pending}</span>
        </div>

        <div className="al-stat-card" style={{ '--card-accent': '#ef4444' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
          <span className="al-stat-label">Expired / Rejected</span>
          <span className="al-stat-value">{kpiStats.expired}</span>
        </div>

        <div className="al-stat-card" style={{ '--card-accent': '#dc2626' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>
            <ShieldAlert size={20} />
          </div>
          <span className="al-stat-label">High Risk in Queue</span>
          <span className="al-stat-value">{kpiStats.highRisk}</span>
        </div>

        <div className="al-stat-card" style={{ '--card-accent': '#22c55e' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            <CheckCircle2 size={20} />
          </div>
          <span className="al-stat-label">Verified (Page)</span>
          <span className="al-stat-value">{kpiStats.verified}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="al-filters">
        <div className="al-search-wrap">
          <Search size={15} className="al-search-icon" />
          <input
            className="al-search-input"
            placeholder="Search by customer name, number, or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <select
          className="al-filter-select"
          value={kycStatus}
          onChange={(e) => {
            setKycStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All KYC Statuses</option>
          <option value="pending">Pending Verification</option>
          <option value="expired">Expired / Rejected</option>
          <option value="verified">Verified</option>
        </select>

        <select
          className="al-filter-select"
          value={riskLevel}
          onChange={(e) => {
            setRiskLevel(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All Risk Ratings</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>

        {branches.length > 0 && (
          <select
            className="al-filter-select"
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
              </option>
            ))}
          </select>
        )}

        {(search || kycStatus || riskLevel || branchId) && (
          <button className="al-btn al-btn-ghost" onClick={handleReset}>
            <RefreshCw size={14} /> Reset
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="al-table-card">
        <div className="al-table-toolbar">
          <span className="al-table-title">
            {loading
              ? 'Loading queue…'
              : `${meta?.total ?? customers.length} customer${(meta?.total ?? customers.length) !== 1 ? 's' : ''} in queue`}
          </span>
        </div>

        {error ? (
          <div className="al-empty">
            <div className="al-empty-icon">⚠️</div>
            <h3>Failed to load KYC Queue</h3>
            <p>{error}</p>
            <button
              className="al-btn al-btn-primary"
              onClick={() => fetchKycQueue({ page, per_page: PER_PAGE })}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="al-loading">
            <div className="al-spinner" />
            <p>Loading KYC verification records…</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="al-empty">
            <div className="al-empty-icon">🪪</div>
            <h3>No customers in KYC queue</h3>
            <p>No customer records match your filter criteria.</p>
            <button className="al-btn al-btn-ghost" onClick={handleReset}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="al-table-wrapper">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Type</th>
                  <th>Risk Rating</th>
                  <th>KYC Status</th>
                  <th>Registration</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const isVerified = c.kyc_status === 'verified'
                  const isPending = c.kyc_status === 'pending'
                  const isExpired = c.kyc_status === 'expired'

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Link
                            to={`/customers/${c.id}`}
                            className="al-link-id"
                            style={{ fontWeight: 600, fontSize: '0.9rem' }}
                          >
                            {c.full_name}
                          </Link>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.customer_number} • {c.email}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                          <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
                          {c.branch?.branch_name ?? 'Headquarters'}
                        </span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {c.customer_type ?? 'Individual'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`al-badge-severity ${c.risk_level === 'high' ? 'high' : c.risk_level === 'medium' ? 'medium' : 'low'}`}
                        >
                          <span className="al-dot" />
                          {c.risk_level ?? 'low'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="al-badge-status"
                          style={{
                            textTransform: 'capitalize',
                            background: isPending
                              ? 'rgba(245,158,11,0.15)'
                              : isExpired
                              ? 'rgba(239,68,68,0.15)'
                              : 'rgba(34,197,94,0.15)',
                            color: isPending ? '#f59e0b' : isExpired ? '#ef4444' : '#22c55e',
                          }}
                        >
                          {c.kyc_status ?? 'pending'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 6,
                          }}
                        >
                          {canVerify && (
                            <>
                              <button
                                className="al-btn al-btn-ghost al-btn-sm"
                                title="Upload & Verify Document"
                                onClick={() => setUploadCustomer(c)}
                                style={{ color: '#38bdf8' }}
                              >
                                <FileCheck size={14} />
                                <span className="al-action-label">Doc Verify</span>
                              </button>

                              {!isVerified && (
                                <button
                                  className="al-btn al-btn-ghost al-btn-sm"
                                  title="Quick Verify KYC"
                                  onClick={() => setConfirmCustomer({ customer: c, action: 'verify' })}
                                  style={{ color: '#22c55e' }}
                                >
                                  <CheckCircle2 size={14} />
                                  <span className="al-action-label">Verify</span>
                                </button>
                              )}

                              {!isExpired && (
                                <button
                                  className="al-btn al-btn-ghost al-btn-sm"
                                  title="Reject / Mark Expired"
                                  onClick={() => setConfirmCustomer({ customer: c, action: 'reject' })}
                                  style={{ color: '#ef4444' }}
                                >
                                  <XCircle size={14} />
                                  <span className="al-action-label">Reject</span>
                                </button>
                              )}
                            </>
                          )}

                          <Link
                            to={`/customers/${c.id}`}
                            className="al-btn al-btn-ghost al-btn-sm"
                            title="View Customer Profile"
                          >
                            <Eye size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="al-pagination">
            <span className="al-pagination-info">
              Showing page {page} of {totalPages} ({meta?.total ?? customers.length} total customers)
            </span>
            <div className="al-pagination-controls">
              <button
                className="al-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="al-page-btn active">{page}</span>
              <button
                className="al-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {uploadCustomer && (
        <UploadDocumentModal
          customer={uploadCustomer}
          onClose={() => setUploadCustomer(null)}
          onSuccess={handleDocumentVerified}
        />
      )}

      {/* Quick Verify / Reject Confirmation Modal */}
      {confirmCustomer && (
        <div className="al-modal-overlay" onClick={() => setConfirmCustomer(null)}>
          <div className="al-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="al-modal-header">
              <div
                className="al-modal-header-icon"
                style={{
                  background:
                    confirmCustomer.action === 'verify'
                      ? 'rgba(34,197,94,0.15)'
                      : 'rgba(239,68,68,0.15)',
                  color: confirmCustomer.action === 'verify' ? '#22c55e' : '#ef4444',
                }}
              >
                {confirmCustomer.action === 'verify' ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div className="al-modal-header-text">
                <h3>
                  {confirmCustomer.action === 'verify'
                    ? 'Approve & Verify KYC?'
                    : 'Mark KYC as Expired / Rejected?'}
                </h3>
                <p>
                  Customer: {confirmCustomer.customer.full_name} (
                  {confirmCustomer.customer.customer_number})
                </p>
              </div>
            </div>

            <div className="al-modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {confirmCustomer.action === 'verify'
                  ? 'This will mark the customer KYC status as verified, granting full access to bank account operations and credit services.'
                  : 'This will transition the customer KYC status to expired. Alerts will trigger and restrictions may apply until renewal documents are received.'}
              </p>
            </div>

            <div className="al-modal-footer">
              <button
                type="button"
                className="al-btn al-btn-ghost"
                onClick={() => setConfirmCustomer(null)}
                disabled={processingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="al-btn al-btn-primary"
                onClick={executeCustomerAction}
                disabled={processingAction}
                style={{
                  background: confirmCustomer.action === 'verify' ? '#22c55e' : '#ef4444',
                  borderColor: confirmCustomer.action === 'verify' ? '#16a34a' : '#dc2626',
                }}
              >
                {processingAction
                  ? 'Processing…'
                  : confirmCustomer.action === 'verify'
                  ? 'Confirm Verification'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
