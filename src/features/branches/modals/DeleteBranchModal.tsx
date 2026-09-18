import { showToast } from '@/shared/hooks'
import React, { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { branchesApi } from '@/features/branches/api/branches'
import type { Branch } from '@/shared/types/user'

interface DeleteBranchModalProps {
  branch: Branch
  onClose: () => void
  onDeleted: (id: number) => void
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  branch,
  onClose,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await branchesApi.delete(branch.id)
      showToast.success(`Branch "${branch.branch_name}" has been deleted.`)
      onDeleted(branch.id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete branch.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="br-modal-overlay" role="dialog" aria-modal="true" aria-label="Delete Branch">
      <div className="br-modal" style={{ maxWidth: 420 }}>
        <div className="br-modal-header">
          <span className="br-modal-title" style={{ color: '#ef4444' }}>
            <AlertTriangle size={18} />
            Delete Branch
          </span>
          <button className="br-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="br-delete-body">
          <div className="br-delete-icon">
            <Trash2 size={26} />
          </div>
          <p className="br-delete-title">Are you sure?</p>
          <p className="br-delete-msg">
            You are about to permanently delete{' '}
            <strong>{branch.branch_name}</strong> (
            <span style={{ fontFamily: 'monospace' }}>{branch.branch_code}</span>
            ). This action cannot be undone.
            <br />
            <br />
            <em>Note: Branches with assigned employees or customers cannot be deleted.</em>
          </p>
        </div>

        <div className="br-modal-footer">
          <button
            type="button"
            className="br-btn br-btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="br-btn br-btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={15} />
            {loading ? 'Deleting…' : 'Delete Branch'}
          </button>
        </div>
      </div>
    </div>
  )
}
