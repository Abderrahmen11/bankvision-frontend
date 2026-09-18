import React from 'react'
import { Download, RefreshCw, UserPlus } from 'lucide-react'

interface CustomerPageHeaderProps {
  loading: boolean
  allowCreate: boolean
  onExportCSV: () => void
  onRefresh: () => void
  onAddCustomer: () => void
}

export const CustomerPageHeader: React.FC<CustomerPageHeaderProps> = ({
  loading,
  allowCreate,
  onExportCSV,
  onRefresh,
  onAddCustomer,
}) => {
  return (
    <div className="cm-page-header">
      <div className="cm-page-header-left">
        <h1>Customer Management</h1>
        <p>Oversee bank customer profiles, KYC compliance verifications, and financial accounts.</p>
      </div>

      <div className="cm-header-actions">
        <button className="cm-btn cm-btn-ghost" onClick={onExportCSV}>
          <Download size={15} />
          Export CSV
        </button>
        <button
          className="cm-btn cm-btn-ghost"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh records"
        >
          <RefreshCw size={15} className={loading ? 'cm-spin' : ''} />
        </button>
        {allowCreate && (
          <button className="cm-btn cm-btn-primary" onClick={onAddCustomer}>
            <UserPlus size={16} />
            Add Customer
          </button>
        )}
      </div>
    </div>
  )
}
