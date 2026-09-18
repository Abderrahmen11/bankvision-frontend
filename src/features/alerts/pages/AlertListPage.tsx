import { useAuth } from '@/shared/hooks'
import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { UserRole } from '@/shared/types/user'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Download,
  Eye,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
  Info,
} from 'lucide-react'
import { alertsApi } from '@/features/alerts/api/alerts'
import type { Alert, AlertListParams } from '@/features/alerts/types'
import {
  canResolveAlert,
  canAssignAlert,
  getAlertTypeConfig,
  getSeverityConfig,
  getStatusConfig,
  exportAlertsToCSV,
  formatAlertDate,
  timeAgo,
} from '../alertHelpers'
import { AssignAlertModal } from '../modals/AssignAlertModal'
import { ResolveAlertModal } from '../modals/ResolveAlertModal'
import { AlertNavTabs } from '../components/AlertNavTabs'
import { Toast } from '../components/Toast'
import { StatCard } from '../components/StatCard'
import { Pagination } from '../components/Pagination'
import { FilterBar } from '../components/FilterBar'
import { EmptyState } from '../components/EmptyState'
import { useToast } from '../hooks/useToast'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { usersApi } from '@/features/users/api/users'
import type { User } from '@/shared/types/user'
import './AlertManagement.css'

type AxiosLikeError = { response?: { data?: { message?: string } } }

const extractApiError = (e: unknown, fallback: string): string => {
  const err = e as AxiosLikeError
  return err?.response?.data?.message ?? (e instanceof Error ? e.message : fallback)
}

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

// Only alert_type values the backend actually writes (runtime + seeded data)
const ALERT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'suspicious_transaction', label: 'Suspicious Txn' },
  { value: 'delinquent_loan', label: 'Loan Delinquent' },
  { value: 'loan_delinquent', label: 'Loan Delinquent (legacy)' },
  { value: 'defaulted_loan', label: 'Defaulted Loan' },
  { value: 'kyc_expiring', label: 'KYC Expiring' },
  { value: 'login_attempt', label: 'Login Attempt' },
]

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

export const AlertListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role ?? 'csr'

  const { toast, showToast } = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [alertType, setAlertType] = useState('')
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  // Debounced search query (380ms)
  const debouncedSearch = useDebouncedValue(search, 380)

  const queryParams = useMemo<AlertListParams>(() => ({
    search: debouncedSearch || undefined,
    alert_type: alertType || undefined,
    severity: severity || undefined,
    status: status || undefined,
    assigned_to: assignedTo ? Number(assignedTo) : undefined,
    page,
    per_page: PER_PAGE,
  }), [debouncedSearch, alertType, severity, status, assignedTo, page])

  // Modals
  const [assignTarget, setAssignTarget] = useState<Alert | null>(null)
  const [resolveTarget, setResolveTarget] = useState<Alert | null>(null)

  const alertsQuery = useQuery({
    queryKey: ['alerts', 'list', queryParams],
    queryFn: () => alertsApi.list(queryParams),
  })

  const alertQueryData = alertsQuery.data
  const alerts = useMemo<Alert[]>(
    () => Array.isArray(alertQueryData?.data) ? alertQueryData.data : [],
    [alertQueryData]
  )
  const meta = (alertsQuery.data?.meta as PaginationMeta | null) ?? null
  const loading = alertsQuery.isFetching
  const error = alertsQuery.error ? extractApiError(alertsQuery.error, 'Failed to load alerts.') : null

  const canListStaff = ['admin', 'manager', 'compliance', 'analyst', 'auditor'].includes(role)
  const staffQuery = useQuery({
    queryKey: ['users', 'staff-options'],
    queryFn: () => usersApi.list({ per_page: 50 }),
    enabled: canListStaff,
  })
  const staffUsers = useMemo<User[]>(() => {
    const res = staffQuery.data as unknown as { data?: User[] } | undefined
    return res?.data ?? []
  }, [staffQuery.data])
  // Quick stats from the current page (lightweight, unchanged computation)
  const stats = useMemo(
    () => ({
      total: meta?.total ?? alerts.length,
      open: alerts.filter((a) => a.status === 'open').length,
      inProgress: alerts.filter((a) => a.status === 'in-progress').length,
      resolved: alerts.filter((a) => a.status === 'resolved').length,
      high: alerts.filter((a) => a.severity === 'high').length,
    }),
    [meta?.total, alerts]
  )

  const handleReset = () => {
    setSearch('')
    setAlertType('')
    setSeverity('')
    setStatus('')
    setAssignedTo('')
    setPage(1)
  }

  const handleExport = () => {
    exportAlertsToCSV(alerts)
    showToast('CSV exported successfully.')
  }

  const handleAssignSuccess = (updated: Alert) => {
    alertsQuery.refetch()
    setAssignTarget(null)
    showToast(`Alert ${updated.alert_number} assigned successfully.`)
  }

  const handleResolveSuccess = (updated: Alert) => {
    alertsQuery.refetch()
    setResolveTarget(null)
    showToast(`Alert ${updated.alert_number} resolved.`)
  }

  const totalPages = meta?.last_page ?? 1

  return (
    <div className="al-page">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="al-header">
        <div className="al-header-left">
          <h1 className="al-title">
            <ShieldAlert size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--warning-400)' }} />
            KYC &amp; AML Alerts
          </h1>
          <p className="al-subtitle">
            Monitor, assign and resolve compliance alerts in real time.
          </p>
        </div>
        <div className="al-header-actions">
          <button className="al-btn al-btn-ghost" onClick={() => alertsQuery.refetch()}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="al-btn al-btn-secondary" onClick={handleExport} disabled={alerts.length === 0}>
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs for Alerts / KYC / AML */}
      <AlertNavTabs />

      {/* Role Info Banner */}
      {role === 'csr' && (
        <div className="al-role-banner info">
          <Info size={15} />
          You are viewing customer-related alerts for your assigned branch only.
        </div>
      )}
      {role === 'analyst' && (
        <div className="al-role-banner warning">
          <TrendingUp size={15} />
          Showing risk-related alerts (suspicious transactions, delinquent/defaulted loans, high-severity) only.
        </div>
      )}

      {/* Stats Grid */}
      <div className="al-stats-grid">
        {[
          {
            label: 'Total Alerts',
            value: meta?.total ?? stats.total,
            icon: <ShieldAlert size={20} />,
            color: 'var(--primary-500)',
            bg: 'rgba(99,102,241,0.12)',
            accent: 'var(--primary-500)',
          },
          {
            label: 'Open',
            value: stats.open,
            icon: <AlertTriangle size={20} />,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.12)',
            accent: '#ef4444',
          },
          {
            label: 'In Progress',
            value: stats.inProgress,
            icon: <Clock size={20} />,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.12)',
            accent: '#f59e0b',
          },
          {
            label: 'Resolved',
            value: stats.resolved,
            icon: <CheckCircle2 size={20} />,
            color: '#22c55e',
            bg: 'rgba(34,197,94,0.12)',
            accent: '#22c55e',
          },
          {
            label: 'High Severity',
            value: stats.high,
            icon: <Shield size={20} />,
            color: '#dc2626',
            bg: 'rgba(220,38,38,0.12)',
            accent: '#dc2626',
          },
        ].map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Filters */}
      <FilterBar>
        <div className="al-search-wrap">
          <Search size={15} className="al-search-icon" />
          <input
            className="al-search-input"
            placeholder="Search by number or description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="al-filter-select"
          value={alertType}
          onChange={(e) => { setAlertType(e.target.value); setPage(1) }}
        >
          {ALERT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="al-filter-select"
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1) }}
        >
          {SEVERITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="al-filter-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {['admin', 'manager', 'compliance', 'analyst', 'auditor'].includes(role) && (
          <select
            className="al-filter-select"
            value={assignedTo}
            onChange={(e) => { setAssignedTo(e.target.value); setPage(1) }}
          >
            <option value="">All Assignees</option>
            {user && <option value={user.id}>Assigned to Me</option>}
            {staffUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        )}
        {(search || alertType || severity || status || assignedTo) && (
          <button className="al-btn al-btn-ghost" onClick={handleReset}>
            <RefreshCw size={14} /> Reset
          </button>
        )}
      </FilterBar>

      {/* Table */}
      <div className="al-table-card">
        <div className="al-table-toolbar">
          <span className="al-table-title">
            {loading ? 'Loading…' : `${meta?.total ?? alerts.length} alert${(meta?.total ?? alerts.length) !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {error ? (
          <EmptyState
            icon="⚠️"
            title="Failed to load alerts"
            message={error}
            action={
              <button className="al-btn al-btn-primary" onClick={() => alertsQuery.refetch()}>
                Retry
              </button>
            }
          />
        ) : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Alert Number</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j}>
                            <div className="al-skeleton" style={{ width: j === 3 ? '80%' : '60%' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : alerts.length === 0
                  ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState
                            icon="🔔"
                            title="No alerts found"
                            message="No alerts match your current filter criteria."
                          />
                        </td>
                      </tr>
                    )
                  : alerts.map((alert) => {
                      const typeConfig = getAlertTypeConfig(alert.alert_type)
                      const sevConfig = getSeverityConfig(alert.severity)
                      const statusConfig = getStatusConfig(alert.status)
                      return (
                        <tr key={alert.id}>
                          <td>
                            <span className="td-alert-num" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-400)' }}>
                              {alert.alert_number}
                            </span>
                          </td>
                          <td>
                            <span
                              className="al-badge"
                              style={{ color: typeConfig.color, background: typeConfig.bg }}
                            >
                              {typeConfig.icon} {typeConfig.label}
                            </span>
                          </td>
                          <td>
                            <span
                              className="al-severity-badge"
                              style={{ color: sevConfig.color, background: sevConfig.bg }}
                            >
                              <span
                                className="al-severity-dot"
                                style={{ background: sevConfig.color }}
                              />
                              {sevConfig.label}
                            </span>
                          </td>
                          <td style={{ maxWidth: 240 }}>
                            <span
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontSize: '0.82rem',
                                color: 'var(--text-secondary)',
                              }}
                              title={alert.description}
                            >
                              {alert.description}
                            </span>
                          </td>
                          <td>
                            <span
                              className="al-badge"
                              style={{ color: statusConfig.color, background: statusConfig.bg }}
                            >
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="td-muted">
                            {alert.assigned_to?.name ?? (
                              <span style={{ opacity: 0.5 }}>Unassigned</span>
                            )}
                          </td>
                          <td className="td-muted" title={formatAlertDate(alert.created_at)}>
                            {timeAgo(alert.created_at)}
                          </td>
                          <td>
                            <div className="al-row-actions">
                              <button
                                className="al-btn al-btn-ghost al-btn-sm"
                                title="View Detail"
                                onClick={() => navigate(`/alerts/${alert.id}`)}
                              >
                                <Eye size={14} />
                              </button>
                              {canAssignAlert(role as UserRole) && alert.status !== 'resolved' && (
                                <button
                                  className="al-btn al-btn-ghost al-btn-sm"
                                  title="Assign"
                                  onClick={() => setAssignTarget(alert)}
                                >
                                  <UserCheck size={14} />
                                </button>
                              )}
                              {canResolveAlert(role as UserRole) && alert.status !== 'resolved' && (
                                <button
                                  className="al-btn al-btn-ghost al-btn-sm"
                                  title="Resolve"
                                  onClick={() => setResolveTarget(alert)}
                                  style={{ color: '#22c55e' }}
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              )}
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
        {!loading && !error && meta && meta.last_page > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            meta={meta}
            onPageChange={setPage}
            variant="numbered"
          />
        )}
      </div>

      {/* Modals */}
      {assignTarget && (
        <AssignAlertModal
          alert={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
      {resolveTarget && (
        <ResolveAlertModal
          alert={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  )
}
