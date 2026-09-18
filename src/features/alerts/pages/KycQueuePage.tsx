import { useAuth } from '@/shared/hooks'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  Info,
  Paperclip,
} from 'lucide-react'
import { customersApi } from '@/features/customers/api/customers'
import { branchesApi } from '@/features/branches/api/branches'
import type { Customer, CustomerListParams } from '@/features/customers/types'
import type { Branch } from '@/shared/types/user'
import { AlertNavTabs } from '../components/AlertNavTabs'
import { Toast } from '../components/Toast'
import { StatCard } from '../components/StatCard'
import { Pagination } from '../components/Pagination'
import { FilterBar } from '../components/FilterBar'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../hooks/useToast'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { exportToCsv } from '../utils/exportCsv'
import { UploadDocumentModal } from '../modals/UploadDocumentModal'
import { KycDocumentsDrawer } from '../modals/KycDocumentsDrawer'
import './AlertManagement.css'
import { getErrorMessage } from '@/shared/utils'

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
  const { toast, showToast } = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [kycStatus, setKycStatus] = useState<string>('pending')
  const [riskLevel, setRiskLevel] = useState<string>('')
  const [branchId, setBranchId] = useState<string>('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  // Quick Action / Modal States
  const [uploadCustomer, setUploadCustomer] = useState<Customer | null>(null)
  const [viewDocsCustomer, setViewDocsCustomer] = useState<Customer | null>(null)
  const [confirmCustomer, setConfirmCustomer] = useState<{
    customer: Customer
    action: 'verify' | 'reject'
  } | null>(null)
  const [processingAction, setProcessingAction] = useState(false)

  // KPI Stats — server-side facet totals (meta.total), refreshed after
  // verify/reject actions via kpiRefreshTick
  const [kpiStats, setKpiStats] = useState({
    pending: 0,
    expired: 0,
    highRisk: 0,
    verified: 0,
  })
  const [kpiRefreshTick, setKpiRefreshTick] = useState(0)

  const debouncedSearch = useDebouncedValue(search, 380)

  const filterParams = useMemo<CustomerListParams>(() => ({
    search: debouncedSearch || undefined,
    kyc_status: kycStatus || undefined,
    risk_level: riskLevel || undefined,
    branch_id: branchId || undefined,
    page,
    per_page: PER_PAGE,
  }), [debouncedSearch, kycStatus, riskLevel, branchId, page])

  // Load branches
  useEffect(() => {
    branchesApi
      .list()
      .then((res) => {
        const list = res.data ?? []
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
        const data = res.data ?? []
        const m = res.meta ?? null
        setCustomers(Array.isArray(data) ? data : [])
        setMeta(m)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load KYC verification queue.'))
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Server-side KPI facet counts (per_page 1 — only meta.total is read)
  // Follows search + branch only (not status/risk tabs) so the cards describe the queue universe.
  useEffect(() => {
    let active = true
    const scope: CustomerListParams = {
      search: debouncedSearch || undefined,
      branch_id: branchId || undefined,
      per_page: 1,
    }
    void Promise.allSettled([
      customersApi.list({ ...scope, kyc_status: 'pending' }),
      customersApi.list({ ...scope, kyc_status: 'expired' }),
      customersApi.list({ ...scope, kyc_status: 'verified' }),
      customersApi.list({ ...scope, risk_level: 'high' }),
    ]).then(([pending, expired, verified, highRisk]) => {
      if (!active) return
      setKpiStats({
        pending: pending.status === 'fulfilled' ? (pending.value.meta?.total ?? 0) : 0,
        expired: expired.status === 'fulfilled' ? (expired.value.meta?.total ?? 0) : 0,
        verified: verified.status === 'fulfilled' ? (verified.value.meta?.total ?? 0) : 0,
        highRisk: highRisk.status === 'fulfilled' ? (highRisk.value.meta?.total ?? 0) : 0,
      })
    })
    return () => {
      active = false
    }
  }, [debouncedSearch, branchId, kpiRefreshTick])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchKycQueue(filterParams)
    }, 0)
    return () => clearTimeout(timer)
  }, [filterParams, fetchKycQueue])

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

    exportToCsv(`kyc-queue-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
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
        kyc_status: targetStatus,
      })
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setKpiRefreshTick((t) => t + 1)
      showToast(
        action === 'verify'
          ? `KYC verified and approved for ${customer.full_name}.`
          : `KYC marked as Expired / Rejected for ${customer.full_name}.`
      )
      setConfirmCustomer(null)
    } catch (err: unknown) {
      showToast(
        getErrorMessage(err, `Failed to ${action} customer KYC.`),
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
    setKpiRefreshTick((t) => t + 1)
    setUploadCustomer(null)
    showToast(`KYC document verified & approved for ${updatedCustomer.full_name}!`)
  }

  const canVerify = ['admin', 'compliance', 'manager'].includes(role)
  const totalPages = meta?.last_page ?? 1

  return (
    <div className="al-page">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

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
        <StatCard label="Pending Verification" value={kpiStats.pending} icon={<Clock size={20} />} color="#f59e0b" bg="rgba(245,158,11,0.12)" accent="#f59e0b" />
        <StatCard label="Expired / Rejected" value={kpiStats.expired} icon={<AlertTriangle size={20} />} color="#ef4444" bg="rgba(239,68,68,0.12)" accent="#ef4444" />
        <StatCard label="High Risk in Queue" value={kpiStats.highRisk} icon={<ShieldAlert size={20} />} color="#dc2626" bg="rgba(220,38,38,0.12)" accent="#dc2626" />
        <StatCard label="Verified" value={kpiStats.verified} icon={<CheckCircle2 size={20} />} color="#22c55e" bg="rgba(34,197,94,0.12)" accent="#22c55e" />
      </div>

      {/* Filters Bar */}
      <FilterBar>
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
      </FilterBar>

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
          <EmptyState
            icon="⚠️"
            title="Failed to load KYC Queue"
            message={error}
            action={
              <button className="al-btn al-btn-primary" onClick={() => fetchKycQueue({ page, per_page: PER_PAGE })}>
                Retry
              </button>
            }
          />
        ) : loading ? (
          <div className="al-loading">
            <div className="al-spinner" />
            <p>Loading KYC verification records…</p>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon="🪪"
            title="No customers in KYC queue"
            message="No customer records match your filter criteria."
            action={<button className="al-btn al-btn-ghost" onClick={handleReset}>Clear Filters</button>}
          />
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
                        <StatusBadge status={c.kyc_status ?? 'pending'} variant="kyc" />
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
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
                          {/* View KYC Documents drawer */}
                          <button
                            className="al-btn al-btn-ghost al-btn-sm cm-kyc-docs-btn"
                            title="View KYC Documents"
                            onClick={() => setViewDocsCustomer(c)}
                          >
                            <Paperclip size={14} />
                            {typeof c.document_count === 'number' && c.document_count > 0 && (
                              <span className="cm-kyc-doc-badge">{c.document_count}</span>
                            )}
                          </button>

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
        {totalPages > 1 && meta && (
          <Pagination
            page={page}
            totalPages={totalPages}
            meta={meta}
            onPageChange={setPage}
            variant="simple"
          />
        )}
      </div>

      {/* View KYC Documents Drawer */}
      {viewDocsCustomer && (
        <KycDocumentsDrawer
          customer={viewDocsCustomer}
          canUpload={canVerify}
          isAdmin={role === 'admin'}
          onClose={() => setViewDocsCustomer(null)}
          onOpenUpload={() => {
            setUploadCustomer(viewDocsCustomer)
            setViewDocsCustomer(null)
          }}
          onDocumentDeleted={() => {
            // Refresh the row's doc count after a deletion
            setKpiRefreshTick((t) => t + 1)
            void fetchKycQueue(filterParams)
          }}
        />
      )}

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
        <ConfirmDialog
          title={confirmCustomer.action === 'verify' ? 'Approve & Verify KYC?' : 'Mark KYC as Expired / Rejected?'}
          subtitle={<>Customer: {confirmCustomer.customer.full_name} ({confirmCustomer.customer.customer_number})</>}
          message={confirmCustomer.action === 'verify'
            ? 'This will mark the customer KYC status as verified, granting full access to bank account operations and credit services.'
            : 'This will transition the customer KYC status to expired. Alerts will trigger and restrictions may apply until renewal documents are received.'}
          confirmLabel={confirmCustomer.action === 'verify' ? 'Confirm Verification' : 'Confirm Rejection'}
          confirmColor={confirmCustomer.action === 'verify' ? '#22c55e' : '#ef4444'}
          onConfirm={executeCustomerAction}
          onCancel={() => setConfirmCustomer(null)}
          loading={processingAction}
        />
      )}
    </div>
  )
}
