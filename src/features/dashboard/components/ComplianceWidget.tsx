import { formatMoney } from '@/shared/utils'
import React from 'react'
import { ShieldCheck, AlertCircle, FileCheck, UserX } from 'lucide-react'
import { WidgetShell } from './WidgetShell'
import { useRiskAnalysisData, useWidgetQuery } from '../hooks/useDashboardData'
import { customersApi } from '@/features/customers/api/customers'
import type { DashboardWidgetConfig } from '../types'

interface ComplianceWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

export const ComplianceWidget: React.FC<ComplianceWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const refreshInterval = widget.settings?.refreshInterval ?? 60
  const { data, isLoading, error, refresh, lastUpdated } = useRiskAnalysisData(refreshInterval)

  // KYC verified share from real list totals (role-safe: customers index is
  // readable by every role; branch roles see their own scope).
  const verifiedQuery = useWidgetQuery(
    ['dashboard', 'kyc-verified-count'],
    () => customersApi.list({ kyc_status: 'verified', per_page: 1 }),
    refreshInterval,
  )
  const totalQuery = useWidgetQuery(
    ['dashboard', 'kyc-total-count'],
    () => customersApi.list({ per_page: 1 }),
    refreshInterval,
  )

  const flagged = data?.transaction_risk
  const highRiskCount = data?.customer_risk?.high_risk_count ?? 0

  const verifiedTotal = verifiedQuery.data?.meta?.total ?? 0
  const customerTotal = totalQuery.data?.meta?.total ?? 0
  const kycVerifiedPct =
    customerTotal > 0 ? Math.round((verifiedTotal / customerTotal) * 1000) / 10 : 0
  const kycLoading = verifiedQuery.isLoading || totalQuery.isLoading

  const formatCurrency = (val: number) =>
    formatMoney(Math.round(val || 0))

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'KYC & Regulatory Compliance Oversight'}
      icon={<ShieldCheck size={16} className="text-emerald-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="compliance-widget-content">
        {/* Compliance Gauge Card */}
        <div className="compliance-hero-card">
          <div className="compliance-gauge-circle">
            <span className="gauge-score">{kycLoading ? '—' : `${kycVerifiedPct}%`}</span>
            <span className="gauge-label">KYC Verified</span>
          </div>
          <div className="compliance-hero-details">
            <h4 className="compliance-status-title">KYC Compliance Posture</h4>
            <p className="compliance-status-desc">
              {verifiedTotal} of {customerTotal} customers have verified KYC status.
            </p>
          </div>
        </div>

        {/* Risk Counter Tiles */}
        <div className="compliance-indicators-grid">
          <div className="indicator-tile">
            <div className="indicator-tile-header">
              <FileCheck size={14} className="text-emerald-400" />
              <span>Flagged Txns</span>
            </div>
            <span className="indicator-tile-val text-emerald-400">
              {flagged?.flagged_count ?? 0}
            </span>
            <span className="indicator-tile-sub">
              {formatCurrency(flagged?.flagged_volume ?? 0)}
            </span>
          </div>

          <div className="indicator-tile">
            <div className="indicator-tile-header">
              <UserX size={14} className="text-amber-400" />
              <span>High Risk Cust.</span>
            </div>
            <span className="indicator-tile-val text-amber-400">
              {highRiskCount}
            </span>
            <span className="indicator-tile-sub">Enhanced DD Required</span>
          </div>

          <div className="indicator-tile">
            <div className="indicator-tile-header">
              <AlertCircle size={14} className="text-rose-400" />
              <span>Wire Transfers</span>
            </div>
            <span className="indicator-tile-val text-rose-400">
              {flagged?.wire_count ?? 0}
            </span>
            <span className="indicator-tile-sub">
              {formatCurrency(flagged?.wire_volume ?? 0)} volume
            </span>
          </div>
        </div>
      </div>
    </WidgetShell>
  )
}
