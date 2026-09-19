import React from 'react'
import { Receipt, CheckCircle, Clock, AlertOctagon } from 'lucide-react'
import { WidgetShell } from './WidgetShell'
import { useRecentActivityData } from '../hooks/useDashboardData'
import type { DashboardWidgetConfig } from '../types'

interface RecentTransactionsWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const limit = widget.settings?.limit ?? 10
  const refreshInterval = widget.settings?.refreshInterval ?? 60
  const { data, isLoading, error, refresh, lastUpdated } = useRecentActivityData(limit, refreshInterval)

  const transactions = data?.transactions || []

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="txn-status-badge completed">
            <CheckCircle size={11} /> Completed
          </span>
        )
      case 'flagged':
        return (
          <span className="txn-status-badge flagged">
            <AlertOctagon size={11} /> Flagged
          </span>
        )
      default:
        return (
          <span className="txn-status-badge pending">
            <Clock size={11} /> Pending
          </span>
        )
    }
  }

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Recent Transactions Ledger'}
      icon={<Receipt size={16} className="text-primary-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="txns-table-container">
        {transactions.length === 0 ? (
          <div className="txns-empty-state">
            <p>No transactions found in this period.</p>
          </div>
        ) : (
          <table className="txns-widget-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <span className="txn-id-tag">{tx.number || `#${tx.id}`}</span>
                  </td>
                  <td>
                    <span className="txn-customer-name">{tx.customer || 'Direct Account'}</span>
                  </td>
                  <td>
                    <span className="txn-desc-cell">{tx.description}</span>
                  </td>
                  <td>{getStatusBadge(tx.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="txn-date-cell">
                      {tx.date ? new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </WidgetShell>
  )
}
