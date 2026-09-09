import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, UserCheck, Loader2 } from 'lucide-react'
import { usersApi } from '@/api/users'
import type { Alert } from '@/types/alert'
import type { User } from '@/types/user'
import { alertsApi } from '@/api/alerts'
import '../AlertManagement.css'

interface AssignAlertModalProps {
  alert: Alert
  onClose: () => void
  onSuccess: (updated: Alert) => void
}

export const AssignAlertModal: React.FC<AssignAlertModalProps> = ({
  alert,
  onClose,
  onSuccess,
}) => {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [selected, setSelected] = useState<User | null>(alert.assigned_to ?? null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await usersApi.list({ search: q, per_page: 20 })
      setResults(Array.isArray(res.data) ? res.data : (res as any).data?.data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchUsers(search), 320)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, fetchUsers])

  const handleSubmit = async () => {
    if (!selected) {
      setError('Please select a staff member to assign.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const updated = await alertsApi.assign(alert.id, { user_id: selected.id })
      onSuccess(updated)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to assign alert. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="al-modal-overlay" onClick={onClose}>
      <div className="al-modal" onClick={(e) => e.stopPropagation()}>
        <div className="al-modal-header">
          <h2 className="al-modal-title">
            <UserCheck size={18} style={{ marginRight: 7, verticalAlign: 'middle' }} />
            Assign Alert
          </h2>
          <button className="al-btn al-btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="al-modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Assigning <strong style={{ color: 'var(--primary-400)' }}>{alert.alert_number}</strong> to a staff member will set the status to{' '}
            <strong>In Progress</strong>.
          </p>

          {/* Search */}
          <div className="al-form-group">
            <label className="al-form-label">Search Staff</label>
            <div className="al-search-wrap" style={{ maxWidth: '100%' }}>
              <Search size={15} className="al-search-icon" />
              <input
                className="al-search-input"
                placeholder="Name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Results */}
          <div className="al-search-results">
            {loading ? (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />
                Searching…
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No staff found.
              </div>
            ) : (
              results.map((u) => (
                <div
                  key={u.id}
                  className={`al-search-result-item${selected?.id === u.id ? ' selected' : ''}`}
                  onClick={() => setSelected(u)}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {u.email} · {u.role}
                    </div>
                  </div>
                  {selected?.id === u.id && (
                    <UserCheck size={15} style={{ marginLeft: 'auto', color: 'var(--primary-400)' }} />
                  )}
                </div>
              ))
            )}
          </div>

          {selected && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(99,102,241,0.08)',
                borderRadius: 8,
                fontSize: '0.875rem',
                color: 'var(--primary-300)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <UserCheck size={15} />
              Assigned to: <strong>{selected.name}</strong>
            </div>
          )}

          {error && <p className="al-error-msg">{error}</p>}
        </div>

        <div className="al-modal-footer">
          <button className="al-btn al-btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="al-btn al-btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !selected}
          >
            {submitting ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Assigning…
              </>
            ) : (
              <>
                <UserCheck size={15} />
                Assign Alert
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
