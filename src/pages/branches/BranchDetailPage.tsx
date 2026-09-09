import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Edit3,
  RefreshCw,
  Trash2,
  Users,
  MapPin,
  Phone,
  User,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { branchesApi } from '@/api/branches'
import { usersApi } from '@/api/users'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { Branch, User as UserType } from '@/types/user'
import type { PaginationMeta } from '@/types/api'
import {
  BRANCH_STATUS_CONFIG,
  canEditBranch,
  canDeleteBranch,
  formatDate,
  formatDateTime,
} from './branchHelpers'
import { BranchFormModal } from './modals/BranchFormModal'
import { DeleteBranchModal } from './modals/DeleteBranchModal'
import { ROLE_CONFIGS } from '@/types/user'
import './BranchManagement.css'

export const BranchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const role = authUser?.role

  const allowEdit   = canEditBranch(role)
  const allowDelete = canDeleteBranch(role)

  const [branch, setBranch]         = useState<Branch | null>(null)
  const [employees, setEmployees]   = useState<UserType[]>([])
  const [empMeta, setEmpMeta]       = useState<PaginationMeta | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const fetchBranch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await branchesApi.get(id)
      setBranch(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load branch details.'
      showToast.error(msg)
      navigate('/branches')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  const fetchEmployees = useCallback(async () => {
    if (!id) return
    try {
      const res = await usersApi.list({ branch_id: id, per_page: 50 })
      setEmployees(res.data)
      setEmpMeta(res.meta as PaginationMeta)
    } catch {
      // silently ignore
    }
  }, [id])

  useEffect(() => {
    fetchBranch()
    fetchEmployees()
  }, [fetchBranch, fetchEmployees])

  /* ── After edit ── */
  const handleEditSaved = (saved: Branch) => {
    setBranch(saved)
    setShowEditModal(false)
    showToast.success('Branch updated.')
  }

  /* ── After delete ── */
  const handleDeleted = () => {
    setShowDeleteModal(false)
    navigate('/branches')
  }

  /* ── Role badge helper ── */
  const getRoleBadge = (userRole: string) => {
    const cfg = ROLE_CONFIGS[userRole as keyof typeof ROLE_CONFIGS]
    return cfg ? { label: cfg.label, color: cfg.badgeColor, bg: cfg.badgeBg } : null
  }

  /* ── Status config ── */
  const statusCfg = branch ? (BRANCH_STATUS_CONFIG[branch.status] ?? BRANCH_STATUS_CONFIG.inactive) : null

  /* ── Initials ── */
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  if (loading) {
    return (
      <div className="br-detail-page">
        <div className="br-card">
          <div className="br-card-body">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="br-skeleton" style={{ marginBottom: 12, height: 16, width: i % 2 === 0 ? '60%' : '40%' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!branch) return null

  return (
    <div className="br-detail-page">
      {/* ── Header ── */}
      <div className="br-detail-header">
        <div className="br-detail-header-left">
          <button className="br-back-btn" onClick={() => navigate('/branches')}>
            <ArrowLeft size={15} />
            Back to Branches
          </button>
          <h1 className="br-detail-title">
            <Building2 size={26} color="var(--primary-400)" />
            {branch.branch_name}
          </h1>
          <p className="br-detail-sub">
            <code style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-400)' }}>
              {branch.branch_code}
            </code>
            {branch.city && (
              <>
                {' '}· <MapPin size={13} style={{ verticalAlign: 'middle' }} /> {branch.city}
              </>
            )}
          </p>
        </div>
        <div className="br-detail-actions">
          <button
            className="br-btn br-btn-ghost"
            onClick={() => { fetchBranch(); fetchEmployees() }}
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          {allowEdit && (
            <button
              id="edit-branch-btn"
              className="br-btn br-btn-ghost"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 size={15} />
              Edit Branch
            </button>
          )}
          {allowDelete && (
            <button
              id="delete-branch-btn"
              className="br-btn br-btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      {branch.status !== 'active' && statusCfg && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 10,
            background: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
            color: statusCfg.color,
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {branch.status === 'under_renovation' ? (
            <AlertTriangle size={16} />
          ) : (
            <Clock size={16} />
          )}
          This branch is currently <strong>{statusCfg.label}</strong>.
        </div>
      )}

      {/* ── Main Info + Manager Grid ── */}
      <div className="br-info-grid">
        {/* Branch Information */}
        <div className="br-card">
          <div className="br-card-header">
            <span className="br-card-title">
              <Building2 size={16} />
              Branch Information
            </span>
            {statusCfg && (
              <span
                className="br-status-badge"
                style={{
                  color: statusCfg.color,
                  background: statusCfg.bg,
                  borderColor: statusCfg.border,
                }}
              >
                <span className="br-status-dot" style={{ background: statusCfg.color }} />
                {statusCfg.label}
              </span>
            )}
          </div>
          <div className="br-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="br-info-row">
              <div className="br-info-field">
                <span className="br-info-label">Branch Code</span>
                <span className="br-info-value mono">{branch.branch_code}</span>
              </div>
              <div className="br-info-field">
                <span className="br-info-label">Branch Name</span>
                <span className="br-info-value">{branch.branch_name}</span>
              </div>
            </div>
            <div className="br-info-row">
              <div className="br-info-field">
                <span className="br-info-label">City</span>
                <span className="br-info-value">
                  {branch.city ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} color="var(--text-muted)" />
                      {branch.city}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </span>
              </div>
              <div className="br-info-field">
                <span className="br-info-label">Phone</span>
                <span className="br-info-value">
                  {branch.phone ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={14} color="var(--text-muted)" />
                      {branch.phone}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </span>
              </div>
            </div>
            <div className="br-info-field">
              <span className="br-info-label">Address</span>
              <span className="br-info-value">{branch.address ?? <em className="muted">No address on file</em>}</span>
            </div>
            <div className="br-info-row">
              <div className="br-info-field">
                <span className="br-info-label">Created</span>
                <span className="br-info-value" style={{ fontSize: '0.85rem' }}>
                  {formatDate(branch.created_at)}
                </span>
              </div>
              <div className="br-info-field">
                <span className="br-info-label">Last Updated</span>
                <span className="br-info-value" style={{ fontSize: '0.85rem' }}>
                  {formatDateTime(branch.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Manager + Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Manager Card */}
          <div className="br-card">
            <div className="br-card-header">
              <span className="br-card-title">
                <User size={16} />
                Branch Manager
              </span>
            </div>
            <div className="br-card-body">
              {branch.manager ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      className="br-manager-avatar"
                      style={{ width: 44, height: 44, fontSize: '0.85rem' }}
                    >
                      {getInitials(branch.manager.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {branch.manager.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {branch.manager.email}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/users/${branch.manager.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.8rem',
                      color: 'var(--primary-400)',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={12} />
                    View manager profile
                  </Link>
                </div>
              ) : (
                <div className="br-no-manager" style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                  <User size={32} color="var(--text-muted)" style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                  No manager assigned
                </div>
              )}
            </div>
          </div>

          {/* Metrics Card */}
          <div className="br-card">
            <div className="br-card-header">
              <span className="br-card-title">
                <CheckCircle size={16} />
                Branch Metrics
              </span>
            </div>
            <div className="br-card-body">
              <div className="br-metrics-grid">
                <div className="br-metric-chip">
                  <span className="br-metric-label">Employees</span>
                  <span className="br-metric-value">{branch.total_employees ?? 0}</span>
                </div>
                <div className="br-metric-chip">
                  <span className="br-metric-label">Status</span>
                  <span
                    className="br-metric-value"
                    style={{ fontSize: '1rem', color: statusCfg?.color }}
                  >
                    {statusCfg?.label ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Employee List ── */}
      <div className="br-card">
        <div className="br-card-header">
          <span className="br-card-title">
            <Users size={16} />
            Staff & Employees
            {empMeta && (
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'var(--primary-500)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '0.1rem 0.5rem',
                  fontWeight: 700,
                }}
              >
                {empMeta.total}
              </span>
            )}
          </span>
          <Link
            to={`/users?branch_id=${branch.id}`}
            style={{
              fontSize: '0.8rem',
              color: 'var(--primary-400)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ExternalLink size={13} />
            View all in Users
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {employees.length === 0 ? (
            <div className="br-empty" style={{ padding: '2rem' }}>
              <Users size={32} style={{ opacity: 0.3 }} />
              <p style={{ margin: '0.5rem 0 0' }}>No employees assigned to this branch.</p>
            </div>
          ) : (
            <table className="br-emp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const roleCfg = getRoleBadge(emp.role)
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="br-manager-avatar" style={{ width: 28, height: 28, fontSize: '0.6rem' }}>
                            {getInitials(emp.name)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{emp.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{emp.email}</td>
                      <td>
                        {roleCfg ? (
                          <span
                            className="br-role-badge"
                            style={{ color: roleCfg.color, background: roleCfg.bg }}
                          >
                            {roleCfg.label}
                          </span>
                        ) : (
                          emp.role
                        )}
                      </td>
                      <td>
                        <span
                          className="br-status-badge"
                          style={{
                            color: emp.status === 'active' ? '#10b981' : '#64748b',
                            background: emp.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                            borderColor: emp.status === 'active' ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.25)',
                          }}
                        >
                          <span
                            className="br-status-dot"
                            style={{ background: emp.status === 'active' ? '#10b981' : '#64748b' }}
                          />
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/users/${emp.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.8rem',
                            color: 'var(--primary-400)',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={12} />
                          Profile
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showEditModal && (
        <BranchFormModal
          branch={branch}
          onClose={() => setShowEditModal(false)}
          onSaved={handleEditSaved}
        />
      )}
      {showDeleteModal && (
        <DeleteBranchModal
          branch={branch}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
