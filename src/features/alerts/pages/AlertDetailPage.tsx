import { useAuth } from '@/shared/hooks'
import type { UserRole } from '@/shared/types/user'
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Tag,
  Info,
} from 'lucide-react'
import { alertsApi } from '@/features/alerts/api/alerts'
import type { Alert } from '@/features/alerts/types'
import {
  canResolveAlert,
  canAssignAlert,
  getAlertTypeConfig,
  getSeverityConfig,
  getAlertableLink,
  formatAlertDate,
  timeAgo,
} from '../alertHelpers'
import { AssignAlertModal } from '../modals/AssignAlertModal'
import { ResolveAlertModal } from '../modals/ResolveAlertModal'
import { Toast } from '../components/Toast'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { useToast } from '../hooks/useToast'
import './AlertManagement.css'
import { getErrorMessage } from '@/shared/utils'

const ENTITY_ICONS: Record<string, string> = {
  Customer: '👤',
  Account: '🏦',
  Transaction: '💸',
  Loan: '📋',
}

export const AlertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role ?? 'csr'

  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast, showToast } = useToast()

  const [showAssign, setShowAssign] = useState(false)
  const [showResolve, setShowResolve] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await alertsApi.get(id)
        setAlert(data)
      } catch (e: unknown) {
        setError(getErrorMessage(e, 'Failed to load alert details.'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAssignSuccess = (updated: Alert) => {
    setAlert(updated)
    setShowAssign(false)
    showToast(`Alert assigned to ${updated.assigned_to?.name ?? 'staff'}.`)
  }

  const handleResolveSuccess = (updated: Alert) => {
    setAlert(updated)
    setShowResolve(false)
    showToast('Alert resolved successfully.')
  }

  if (loading) {
    return (
      <div className="al-page">
        <div className="al-back-row">
          <button className="al-back-btn" onClick={() => navigate('/alerts')}>
            <ChevronLeft size={16} /> Back to Alerts
          </button>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="al-detail-card" style={{ padding: 24 }}>
            {Array.from({ length: 5 }).map((__, j) => (
              <div key={j} className="al-skeleton" style={{ marginBottom: 14, width: j % 2 === 0 ? '70%' : '50%' }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (error || !alert) {
    return (
      <div className="al-page">
        <div className="al-back-row">
          <button className="al-back-btn" onClick={() => navigate('/alerts')}>
            <ChevronLeft size={16} /> Back to Alerts
          </button>
        </div>
        <EmptyState
          icon="⚠️"
          title="Alert not found"
          message={error ?? 'This alert may not exist or you may not have access.'}
          style={{ paddingTop: 80 }}
        />
      </div>
    )
  }

  const typeConfig = getAlertTypeConfig(alert.alert_type)
  const sevConfig = getSeverityConfig(alert.severity)
  const entityLink = getAlertableLink(alert.alertable)

  // Build timeline
  const timeline: { event: string; time: string | null; icon: React.ReactNode; color: string }[] = [
    {
      event: 'Alert Created',
      time: formatAlertDate(alert.created_at),
      icon: <ShieldAlert size={14} />,
      color: 'var(--primary-500)',
    },
  ]
  if (alert.assigned_to) {
    timeline.push({
      event: `Assigned to ${alert.assigned_to.name}`,
      time: formatAlertDate(alert.updated_at),
      icon: <UserCheck size={14} />,
      color: '#f59e0b',
    })
  }
  if (alert.status === 'resolved' && alert.resolved_at) {
    timeline.push({
      event: 'Alert Resolved',
      time: formatAlertDate(alert.resolved_at),
      icon: <CheckCircle2 size={14} />,
      color: '#22c55e',
    })
  }

  return (
    <div className="al-page">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Back */}
      <div className="al-back-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button className="al-back-btn" onClick={() => navigate('/alerts')}>
          <ChevronLeft size={16} /> Back to Alerts
        </button>
        <div className="al-header-actions">
          {canAssignAlert(role as UserRole) && alert.status !== 'resolved' && (
            <button className="al-btn al-btn-secondary" onClick={() => setShowAssign(true)}>
              <UserCheck size={15} /> Assign
            </button>
          )}
          {canResolveAlert(role as UserRole) && alert.status !== 'resolved' && (
            <button className="al-btn al-btn-resolve" onClick={() => setShowResolve(true)}>
              <CheckCircle2 size={15} /> Resolve
            </button>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: '22px 28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 13,
            background: typeConfig.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {typeConfig.icon}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '1.15rem',
                color: 'var(--primary-400)',
              }}
            >
              {alert.alert_number}
            </span>
            <span className="al-badge" style={{ color: typeConfig.color, background: typeConfig.bg }}>
              {typeConfig.label}
            </span>
            <span className="al-severity-badge" style={{ color: sevConfig.color, background: sevConfig.bg }}>
              <span className="al-severity-dot" style={{ background: sevConfig.color }} />
              {sevConfig.label}
            </span>
            <StatusBadge status={alert.status} variant="alert" />
          </div>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {alert.description}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
            Created {timeAgo(alert.created_at)} - {formatAlertDate(alert.created_at)}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="al-detail-grid">
        {/* Alert Information */}
        <div className="al-detail-card">
          <div className="al-detail-card-header">
            <Info size={15} />
            Alert Information
          </div>
          <div className="al-detail-card-body">
            <div className="al-info-row">
              <span className="al-info-label">Alert Number</span>
              <span className="al-info-value" style={{ fontFamily: 'monospace', color: 'var(--primary-400)', fontWeight: 700 }}>
                {alert.alert_number}
              </span>
            </div>
            <div className="al-info-row">
              <span className="al-info-label">Type</span>
              <span className="al-badge" style={{ color: typeConfig.color, background: typeConfig.bg }}>
                {typeConfig.icon} {typeConfig.label}
              </span>
            </div>
            <div className="al-info-row">
              <span className="al-info-label">Severity</span>
              <span className="al-severity-badge" style={{ color: sevConfig.color, background: sevConfig.bg }}>
                <span className="al-severity-dot" style={{ background: sevConfig.color }} />
                {sevConfig.label}
              </span>
            </div>
            <div className="al-info-row">
              <span className="al-info-label">Status</span>
              <StatusBadge status={alert.status} variant="alert" />
            </div>
            <div className="al-info-row">
              <span className="al-info-label">Created</span>
              <span className="al-info-value" style={{ fontSize: '0.82rem' }}>
                {formatAlertDate(alert.created_at)}
              </span>
            </div>
            {alert.resolved_at && (
              <div className="al-info-row">
                <span className="al-info-label">Resolved</span>
                <span className="al-info-value" style={{ fontSize: '0.82rem', color: '#22c55e' }}>
                  {formatAlertDate(alert.resolved_at)}
                </span>
              </div>
            )}
            <div className="al-info-row">
              <span className="al-info-label">Description</span>
            </div>
            <div className="al-description-box">{alert.description}</div>
          </div>
        </div>

        {/* Assignment & Related Entity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Assignment */}
          <div className="al-detail-card">
            <div className="al-detail-card-header">
              <UserCheck size={15} />
              Assignment
            </div>
            <div className="al-detail-card-body">
              {alert.assigned_to ? (
                <>
                  <div className="al-info-row">
                    <span className="al-info-label">Assigned To</span>
                    <span className="al-info-value" style={{ fontWeight: 700 }}>
                      {alert.assigned_to.name}
                    </span>
                  </div>
                  <div className="al-info-row">
                    <span className="al-info-label">Role</span>
                    <span className="al-info-value">{alert.assigned_to.role}</span>
                  </div>
                  <div className="al-info-row">
                    <span className="al-info-label">Email</span>
                    <span className="al-info-value" style={{ fontSize: '0.82rem' }}>
                      {alert.assigned_to.email}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <UserCheck size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  Not yet assigned
                  {canAssignAlert(role as UserRole) && alert.status !== 'resolved' && (
                    <div style={{ marginTop: 10 }}>
                      <button className="al-btn al-btn-secondary al-btn-sm" onClick={() => setShowAssign(true)}>
                        <UserCheck size={13} /> Assign Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Entity */}
          <div className="al-detail-card">
            <div className="al-detail-card-header">
              <Tag size={15} />
              Related Entity
            </div>
            <div className="al-detail-card-body">
              {alert.alertable ? (
                <div className="al-entity-card">
                  <div
                    className="al-entity-icon"
                    style={{ background: 'rgba(99,102,241,0.12)' }}
                  >
                    {ENTITY_ICONS[alert.alertable.type] ?? '🔗'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="al-entity-label">{alert.alertable.type}</div>
                    <div className="al-entity-value">#{alert.alertable.id}</div>
                  </div>
                  {entityLink && (
                    <Link to={entityLink} className="al-btn al-btn-ghost al-btn-sm">
                      <ExternalLink size={14} /> View
                    </Link>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No related entity linked.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="al-detail-card">
        <div className="al-detail-card-header">
          <Clock size={15} />
          Status Timeline
        </div>
        <div className="al-detail-card-body">
          <div className="al-timeline">
            {timeline.map((item, idx) => (
              <div key={idx} className="al-timeline-item">
                <div className="al-timeline-dot" style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon}
                </div>
                <div className="al-timeline-content">
                  <div className="al-timeline-event">{item.event}</div>
                  <div className="al-timeline-time">{item.time ?? '-'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAssign && (
        <AssignAlertModal
          alert={alert}
          onClose={() => setShowAssign(false)}
          onSuccess={handleAssignSuccess}
        />
      )}
      {showResolve && (
        <ResolveAlertModal
          alert={alert}
          onClose={() => setShowResolve(false)}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  )
}
