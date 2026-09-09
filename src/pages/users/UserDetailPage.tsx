import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, KeyRound, AlertOctagon, CheckCircle2,
  Trash2, Shield,
  Clock, Activity, RefreshCw, LogIn, CheckCircle,
  Save
} from 'lucide-react'
import { usersApi } from '@/api/users'
import { branchesApi } from '@/api/branches'
import { auditLogsApi, type AuditLog } from '@/api/auditLogs'
import { useAuth } from '@/hooks/useAuth'
import { showToast } from '@/hooks/useToast'
import type { User, Branch } from '@/types/user'
import {
  ROLE_LABELS, ROLE_COLORS, getAvatarColor, getInitials,
  formatDate, formatDateTime
} from './userHelpers'
import { EditUserModal } from './modals/EditUserModal'
import { DeleteUserModal } from './modals/DeleteUserModal'
import { ResetPasswordModal } from './modals/ResetPasswordModal'
import { SuspendUserModal } from './modals/SuspendUserModal'
import './UserManagement.css'

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin, user: authUser } = useAuth()

  const [user, setUser] = useState<User | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'logins'>('overview')

  // Activity logs & login logs
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [suspendModalTarget, setSuspendModalTarget] = useState<'active' | 'suspended' | null>(null)

  // Inline Quick Edit state for Overview tab
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'csr',
    branch_id: '',
    status: 'active',
  })
  const [formDirty, setFormDirty] = useState(false)
  const [savingForm, setSavingForm] = useState(false)

  // Fetch branches
  useEffect(() => {
    branchesApi
      .list({ per_page: 100 })
      .then((res) => setBranches(res.data))
      .catch(() => {})
  }, [])

  // Fetch user data
  const fetchUser = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await usersApi.get(id)
      setUser(data)
      setEditForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'csr',
        branch_id: data.branch_id ? String(data.branch_id) : '',
        status: data.status || 'active',
      })
      setFormDirty(false)
    } catch (err) {
      showToast.error('User not found or access denied.')
      navigate('/users')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Fetch activity logs
  const fetchLogs = useCallback(async () => {
    if (!id) return
    setLogsLoading(true)
    try {
      const res = await auditLogsApi.list({
        user_id: id,
        per_page: 50,
      })
      setActivityLogs(res.data || [])
    } catch {
      // Graceful fallback if audit logs not reachable
      setActivityLogs([])
    } finally {
      setLogsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (activeTab === 'activity' || activeTab === 'logins') {
      fetchLogs()
    }
  }, [activeTab, fetchLogs])

  const handleInlineSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSavingForm(true)
    try {
      const updated = await usersApi.update(user.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
        role: editForm.role,
        branch_id: editForm.branch_id ? Number(editForm.branch_id) : null,
        status: editForm.status,
      })
      setUser(updated)
      setFormDirty(false)
      showToast.success('User profile updated successfully!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user profile.'
      showToast.error(msg)
    } finally {
      setSavingForm(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="um-page">
        <div className="um-loading" style={{ minHeight: '350px' }}>
          <div className="um-spinner" />
          <span>Loading user details…</span>
        </div>
      </div>
    )
  }

  const isSelf = authUser?.id === user.id
  const loginLogs = activityLogs.filter(
    (l) =>
      l.action === 'login' ||
      l.event === 'login' ||
      l.table_name === 'users' && l.action === 'login'
  )

  return (
    <div className="um-page">
      {/* Top Breadcrumb & Navigation */}
      <div className="um-page-header">
        <div className="um-page-header-left">
          <button
            className="um-btn um-btn-ghost"
            onClick={() => navigate('/users')}
            style={{ marginBottom: '0.75rem' }}
          >
            <ArrowLeft size={16} />
            Back to Staff Directory
          </button>
          <h1>{user.name}</h1>
          <p>
            {ROLE_LABELS[user.role] || user.role} • {user.branch ? `${user.branch.branch_name} (${user.branch.branch_code})` : 'Global / Unassigned'}
          </p>
        </div>

        {isAdmin && (
          <div className="um-header-actions">
            <button
              className="um-btn um-btn-ghost"
              onClick={() => setShowResetModal(true)}
            >
              <KeyRound size={15} />
              Reset Password
            </button>
            <button
              className="um-btn um-btn-primary"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil size={15} />
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Profile Card (Left) + Tabs / Content (Right) */}
      <div className="um-detail-grid">
        {/* Profile Card */}
        <div className="um-profile-card">
          <div className="um-profile-card-header">
            <div
              className="um-profile-avatar"
              style={{ background: getAvatarColor(user.name) }}
            >
              {getInitials(user.name)}
            </div>
            <h2 className="um-profile-name">{user.name}</h2>
            <span className="um-profile-email">{user.email}</span>

            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span
                className="um-role-badge"
                style={{
                  color: ROLE_COLORS[user.role] || '#818cf8',
                  background: `${ROLE_COLORS[user.role] || '#818cf8'}1a`,
                  borderColor: `${ROLE_COLORS[user.role] || '#818cf8'}35`,
                }}
              >
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <span className={`um-status-badge ${user.status}`}>
                <span className="um-status-dot" />
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="um-profile-meta">
            <div className="um-profile-meta-row">
              <span className="label">Staff ID</span>
              <span className="value">#{user.id}</span>
            </div>
            <div className="um-profile-meta-row">
              <span className="label">Phone</span>
              <span className="value">{user.phone || '—'}</span>
            </div>
            <div className="um-profile-meta-row">
              <span className="label">Branch</span>
              <span className="value">{user.branch?.branch_name || 'Global'}</span>
            </div>
            <div className="um-profile-meta-row">
              <span className="label">Joined</span>
              <span className="value">{formatDate(user.created_at)}</span>
            </div>
            <div className="um-profile-meta-row">
              <span className="label">Last Login</span>
              <span className="value">{formatDateTime(user.last_login_at)}</span>
            </div>
          </div>

          {isAdmin && (
            <div className="um-profile-actions">
              {user.status === 'suspended' ? (
                <button
                  className="um-btn um-btn-success"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setSuspendModalTarget('active')}
                >
                  <CheckCircle2 size={15} />
                  Reactivate Account
                </button>
              ) : (
                <button
                  className="um-btn um-btn-warning"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setSuspendModalTarget('suspended')}
                  disabled={isSelf}
                  title={isSelf ? 'You cannot suspend your own account' : undefined}
                >
                  <AlertOctagon size={15} />
                  Suspend Account
                </button>
              )}

              <button
                className="um-btn um-btn-danger"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowDeleteModal(true)}
                disabled={isSelf}
                title={isSelf ? 'You cannot delete your own account' : undefined}
              >
                <Trash2 size={15} />
                Delete Account
              </button>
            </div>
          )}
        </div>

        {/* Right Content Tabs */}
        <div>
          <div className="um-tabs">
            <button
              className={`um-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Shield size={16} />
              Profile & Assignments
            </button>
            <button
              className={`um-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={16} />
              Activity Log ({activityLogs.length})
            </button>
            <button
              className={`um-tab ${activeTab === 'logins' ? 'active' : ''}`}
              onClick={() => setActiveTab('logins')}
            >
              <LogIn size={16} />
              Login History ({loginLogs.length})
            </button>
          </div>

          <div className="um-tab-content">
            {/* Tab 1: Profile & Assignments (Editable for Admins) */}
            {activeTab === 'overview' && (
              <form onSubmit={handleInlineSave}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Account & Role Configuration
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Manage staff credentials, permission levels, and branch assignments.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="submit"
                      className="um-btn um-btn-primary"
                      disabled={!formDirty || savingForm}
                    >
                      <Save size={15} />
                      {savingForm ? 'Saving…' : 'Save Changes'}
                    </button>
                  )}
                </div>

                <div className="um-form-grid">
                  {/* Full Name */}
                  <div className="um-form-group">
                    <label className="um-label">Full Name</label>
                    <input
                      className="um-input"
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm({ ...editForm, name: e.target.value })
                        setFormDirty(true)
                      }}
                      disabled={!isAdmin}
                    />
                  </div>

                  {/* Email */}
                  <div className="um-form-group">
                    <label className="um-label">Email Address</label>
                    <input
                      className="um-input"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => {
                        setEditForm({ ...editForm, email: e.target.value })
                        setFormDirty(true)
                      }}
                      disabled={!isAdmin}
                    />
                  </div>

                  {/* Phone */}
                  <div className="um-form-group">
                    <label className="um-label">Phone Number</label>
                    <input
                      className="um-input"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => {
                        setEditForm({ ...editForm, phone: e.target.value })
                        setFormDirty(true)
                      }}
                      placeholder="+1-555-0100"
                      disabled={!isAdmin}
                    />
                  </div>

                  {/* Role Selection */}
                  <div className="um-form-group">
                    <label className="um-label">System Role</label>
                    <select
                      className="um-input um-select"
                      value={editForm.role}
                      onChange={(e) => {
                        setEditForm({ ...editForm, role: e.target.value })
                        setFormDirty(true)
                      }}
                      disabled={!isAdmin || isSelf}
                      style={{ appearance: 'auto' }}
                    >
                      {(['admin', 'manager', 'compliance', 'analyst', 'csr', 'auditor'] as const).map(
                        (r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        )
                      )}
                    </select>
                    {isSelf && (
                      <span className="um-field-error" style={{ color: 'var(--text-muted)' }}>
                        You cannot change your own role.
                      </span>
                    )}
                  </div>

                  {/* Branch Selection */}
                  <div className="um-form-group">
                    <label className="um-label">Branch Assignment</label>
                    <select
                      className="um-input um-select"
                      value={editForm.branch_id}
                      onChange={(e) => {
                        setEditForm({ ...editForm, branch_id: e.target.value })
                        setFormDirty(true)
                      }}
                      disabled={!isAdmin}
                      style={{ appearance: 'auto' }}
                    >
                      <option value="">— Global / No Specific Branch —</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name} ({b.branch_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Selection */}
                  <div className="um-form-group">
                    <label className="um-label">Account Status</label>
                    <select
                      className="um-input um-select"
                      value={editForm.status}
                      onChange={(e) => {
                        setEditForm({ ...editForm, status: e.target.value })
                        setFormDirty(true)
                      }}
                      disabled={!isAdmin || isSelf}
                      style={{ appearance: 'auto' }}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {formDirty && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="um-btn um-btn-ghost"
                      onClick={() => {
                        setEditForm({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          role: user.role || 'csr',
                          branch_id: user.branch_id ? String(user.branch_id) : '',
                          status: user.status || 'active',
                        })
                        setFormDirty(false)
                      }}
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="um-btn um-btn-primary"
                      disabled={savingForm}
                    >
                      <Save size={15} />
                      {savingForm ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Tab 2: Activity History */}
            {activeTab === 'activity' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Staff Actions & Audit Trail
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      All recorded banking events executed by {user.name}.
                    </p>
                  </div>
                  <button
                    className="um-btn um-btn-ghost"
                    onClick={fetchLogs}
                    disabled={logsLoading}
                  >
                    <RefreshCw size={14} className={logsLoading ? 'um-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {logsLoading ? (
                  <div className="um-loading" style={{ minHeight: '180px' }}>
                    <div className="um-spinner" />
                    <span>Loading audit records…</span>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="um-empty" style={{ padding: '2.5rem 1rem' }}>
                    <Activity size={32} color="var(--text-muted)" />
                    <p>No activity logs recorded for this user yet.</p>
                  </div>
                ) : (
                  <div>
                    {activityLogs.map((log) => {
                      const isCreate = log.action === 'create' || log.action === 'store'
                      const isDelete = log.action === 'delete' || log.action === 'destroy'
                      const isUpdate = log.action === 'update' || log.action === 'edit'
                      const dotColor = isDelete ? '#f43f5e' : isCreate ? '#10b981' : isUpdate ? '#3b82f6' : '#a855f7'

                      return (
                        <div key={log.id} className="um-activity-entry">
                          <span
                            className="um-activity-dot"
                            style={{ background: dotColor }}
                          />
                          <div className="um-activity-content">
                            <div className="um-activity-event">
                              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: dotColor }}>
                                {log.action}
                              </span>
                              <span style={{ color: 'var(--text-secondary)' }}>on</span>
                              <span>{log.table_name || log.auditable_type || 'system'}</span>
                              {log.record_id && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  #{log.record_id}
                                </span>
                              )}
                            </div>
                            <div className="um-activity-meta">
                              <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{formatDateTime(log.created_at)}</span>
                              {log.ip_address && (
                                <span>IP: {log.ip_address}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Login History */}
            {activeTab === 'logins' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Staff Login History
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Sign-in timestamps, IP addresses, and session access points.
                    </p>
                  </div>
                  <button
                    className="um-btn um-btn-ghost"
                    onClick={fetchLogs}
                    disabled={logsLoading}
                  >
                    <RefreshCw size={14} className={logsLoading ? 'um-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {logsLoading ? (
                  <div className="um-loading" style={{ minHeight: '180px' }}>
                    <div className="um-spinner" />
                    <span>Loading login sessions…</span>
                  </div>
                ) : loginLogs.length === 0 ? (
                  <div className="um-empty" style={{ padding: '2.5rem 1rem' }}>
                    <LogIn size={32} color="var(--text-muted)" />
                    <p>No recent login records recorded yet.</p>
                    {user.last_login_at && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Last recorded login: {formatDateTime(user.last_login_at)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    {loginLogs.map((log) => (
                      <div key={log.id} className="um-activity-entry">
                        <span
                          className="um-activity-dot"
                          style={{ background: '#10b981' }}
                        />
                        <div className="um-activity-content">
                          <div className="um-activity-event">
                            <CheckCircle size={14} color="#10b981" />
                            <span>Successful Sign-in</span>
                          </div>
                          <div className="um-activity-meta">
                            <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{formatDateTime(log.created_at)}</span>
                            <span>IP: {log.ip_address || '127.0.0.1'}</span>
                            {log.user_agent && (
                              <span title={log.user_agent} style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Agent: {log.user_agent}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditUserModal
          user={user}
          branches={branches}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchUser()
          }}
        />
      )}

      {showResetModal && (
        <ResetPasswordModal
          user={user}
          onClose={() => setShowResetModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteUserModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            setShowDeleteModal(false)
            navigate('/users')
          }}
        />
      )}

      {suspendModalTarget && (
        <SuspendUserModal
          user={user}
          targetStatus={suspendModalTarget}
          onClose={() => setSuspendModalTarget(null)}
          onSuccess={() => {
            setSuspendModalTarget(null)
            fetchUser()
          }}
        />
      )}
    </div>
  )
}
