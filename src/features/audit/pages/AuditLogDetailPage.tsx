import { showToast, useAuth } from '@/shared/hooks'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  FileSpreadsheet,
  Fingerprint,
  Globe,
  Hash,
  Monitor,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react'
import { auditLogsApi } from '@/features/audit/api/auditLogs'
import type { AuditLog } from '@/features/audit/types'
import {
  getActionMeta,
  getResourceLabel,
  getResourceRoute,
  formatAuditTimestamp,
  titleCase,
} from '../auditHelpers'
import './AuditLogs.css'

/** Fields whose values are never rendered raw in the diff view. */
const SENSITIVE_FIELDS = ['password', 'password_confirmation', 'token', 'remember_token']

function maskIfNeeded(key: string, value: unknown): string {
  if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f))) {
    return '••••••••'
  }
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged'

interface DiffRow {
  field: string
  status: DiffStatus
  before: string
  after: string
}

/** Build a field-level before/after diff across the old/new value maps. */
function buildDiff(log: AuditLog): DiffRow[] {
  const oldValues = log.old_values ?? {}
  const newValues = log.new_values ?? {}
  const fields = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)])).sort()

  return fields.map((field) => {
    const inOld = field in oldValues
    const inNew = field in newValues
    const before = maskIfNeeded(field, oldValues[field])
    const after = maskIfNeeded(field, newValues[field])
    let status: DiffStatus
    if (!inOld && inNew) status = 'added'
    else if (inOld && !inNew) status = 'removed'
    else if (before !== after) status = 'changed'
    else status = 'unchanged'
    return { field, status, before, after }
  })
}

export const AuditLogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()
  const canManageUsers = hasAnyRole(['admin', 'manager'])

  const [log, setLog] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    if (!id) return
    auditLogsApi
      .get(id)
      .then((data) => {
        if (active) setLog(data)
      })
      .catch((err) => {
        if (!active) return
        setNotFound(true)
        showToast.error(err instanceof Error ? err.message : 'Failed to load audit entry.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="al-page">
        <div className="al-detail-skeleton">
          <div className="al-skeleton-line" style={{ width: 180, height: 32 }} />
          <div className="al-skeleton-block" />
          <div className="al-skeleton-block" style={{ height: 260 }} />
        </div>
      </div>
    )
  }

  if (notFound || !log) {
    return (
      <div className="al-page">
        <div className="al-restricted">
          <div className="al-restricted-icon">
            <ShieldAlert size={28} />
          </div>
          <h2>Audit Entry Not Found</h2>
          <p>This audit entry does not exist, or your role does not permit viewing it.</p>
          <Link to="/audit-logs" className="al-btn al-btn-ghost" style={{ margin: '1.25rem auto 0', textDecoration: 'none' }}>
            <ArrowLeft size={15} />
            Back to Audit Logs
          </Link>
        </div>
      </div>
    )
  }

  const actionMeta = getActionMeta(log.action)
  const diff = buildDiff(log)
  const hasDiff = diff.length > 0
  const resourceRoute = getResourceRoute(log)
  const changedCount = diff.filter((r) => r.status !== 'unchanged').length

  return (
    <div className="al-page">
      {/* ── Header ── */}
      <header className="al-header">
        <div className="al-header-left">
          <button type="button" className="al-back-btn" onClick={() => navigate('/audit-logs')}>
            <ArrowLeft size={16} />
            Audit Logs
          </button>
          <h1>
            <FileSpreadsheet size={22} color="#6366f1" />
            Audit Entry #{log.id}
          </h1>
          <div className="al-detail-meta">
            <span className="al-action-badge" style={{ color: actionMeta.color, background: actionMeta.bg }}>
              {actionMeta.label}
            </span>
            <span className="al-detail-meta-item">
              <Hash size={13} />
              {getResourceLabel(log.table_name)}
              {log.record_id !== null && log.record_id !== undefined ? ` #${log.record_id}` : ''}
            </span>
            <span className="al-detail-meta-item">
              <Calendar size={13} />
              {formatAuditTimestamp(log.created_at)}
            </span>
          </div>
        </div>
      </header>

      <div className="al-detail-grid">
        {/* ── Actor card ── */}
        <section className="al-card">
          <h3 className="al-card-title">
            <UserIcon size={16} />
            Performed By
          </h3>
          {log.user ? (
            <div className="al-actor">
              <div className="al-avatar al-avatar-lg">
                {log.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="al-actor-info">
                <strong>
                  {canManageUsers ? (
                    <Link to={`/users/${log.user.id}`} className="al-actor-link">
                      {log.user.name}
                    </Link>
                  ) : (
                    log.user.name
                  )}
                </strong>
                <span>{log.user.email}</span>
                <span className="al-actor-role">{titleCase(log.user.role)}</span>
              </div>
            </div>
          ) : (
            <p className="al-actor-empty">System / deleted user</p>
          )}

          <dl className="al-facts">
            <div>
              <dt>
                <Globe size={13} />
                IP Address
              </dt>
              <dd className="al-mono">{log.ip_address ?? '-'}</dd>
            </div>
            <div>
              <dt>
                <Fingerprint size={13} />
                Record ID
              </dt>
              <dd className="al-mono">{log.record_id ?? '-'}</dd>
            </div>
            <div>
              <dt>
                <Building2 size={13} />
                Resource
              </dt>
              <dd>
                {resourceRoute ? (
                  <Link to={resourceRoute} className="al-actor-link">
                    {getResourceLabel(log.table_name)} #{log.record_id}
                  </Link>
                ) : (
                  getResourceLabel(log.table_name)
                )}
              </dd>
            </div>
            <div>
              <dt>
                <Monitor size={13} />
                User Agent
              </dt>
              <dd className="al-agent">{log.user_agent ?? '-'}</dd>
            </div>
          </dl>
        </section>

        {/* ── Changes diff ── */}
        <section className="al-card al-card-diff">
          <h3 className="al-card-title">
            <ArrowRight size={16} />
            Changes {hasDiff && <span className="al-diff-count">{changedCount} changed</span>}
          </h3>

          {!hasDiff ? (
            <p className="al-no-diff">This entry has no recorded before/after values (e.g. a sign-in event).</p>
          ) : (
            <div className="al-diff-table-wrap">
              <table className="al-diff-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Before</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.map((row) => (
                    <tr key={row.field} className={`al-diff-${row.status}`}>
                      <td className="al-diff-field">{titleCase(row.field)}</td>
                      <td className="al-diff-value">
                        {row.status === 'added' ? (
                          <em className="al-diff-absent">not set</em>
                        ) : (
                          <code>{row.before}</code>
                        )}
                        {row.status === 'removed' && <span className="al-diff-tag removed">removed</span>}
                      </td>
                      <td className="al-diff-value">
                        {row.status === 'removed' ? (
                          <em className="al-diff-absent">deleted</em>
                        ) : (
                          <code>{row.after}</code>
                        )}
                        {row.status === 'added' && <span className="al-diff-tag added">new</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

