import { formatMoney } from '@/shared/utils'
import { useAuth } from '@/shared/hooks'
import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  Users,
  Eye,
  Activity,
  ExternalLink,
} from 'lucide-react'
import { dashboardApi } from '@/features/dashboard'
import { customersApi } from '@/features/customers/api/customers'
import { transactionsApi } from '@/features/transactions/api/transactions'
import { alertsApi } from '@/features/alerts/api/alerts'
import { sarFilingsApi } from '@/features/alerts/api/sarFilings'
import type { Customer } from '@/features/customers/types'
import type { Transaction } from '@/features/transactions/types'
import type { SarFiling } from '@/features/alerts/sarTypes'
import type { RiskAnalysisData } from '@/features/dashboard/types'
import { getErrorMessage } from '@/shared/utils'
import { AlertNavTabs } from '../components/AlertNavTabs'
import { Toast } from '../components/Toast'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { FileSarModal } from '../modals/FileSarModal'
import { useToast } from '../hooks/useToast'
import { exportToCsv } from '../utils/exportCsv'
import './AlertManagement.css'

interface HeatmapBranchRisk {
  branchId: number
  branchName: string
  lowCount: number
  mediumCount: number
  highCount: number
  totalCount: number
  riskScore: number // 0-100
}

// GET /dashboard/risk-analysis payload (see RiskAnalysisData) — alias kept
// for local readability.
type AmlRiskData = RiskAnalysisData

export const AmlDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'csr'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast, showToast } = useToast()

  // Data states
  const [riskData, setRiskData] = useState<AmlRiskData | null>(null)
  const [highRiskCustomers, setHighRiskCustomers] = useState<Customer[]>([])
  const [flaggedTransactions, setFlaggedTransactions] = useState<Transaction[]>([])
  const [sarFilings, setSarFilings] = useState<SarFiling[]>([])
  const [highSeverityAlerts, setHighSeverityAlerts] = useState(0)
  const [showSarModal, setShowSarModal] = useState(false)

  const loadAmlData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [riskRes, custRes, txRes, sarRes, alertRes] = await Promise.allSettled([
        dashboardApi.getRiskAnalysis(),
        customersApi.list({ risk_level: 'high', per_page: 15 }),
        transactionsApi.list({ status: 'flagged', per_page: 15 }),
        sarFilingsApi.list({ per_page: 10 }),
        alertsApi.list({ severity: 'high', status: 'open', per_page: 1 }),
      ])

      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value)
      }
      if (custRes.status === 'fulfilled') {
        const d = custRes.value?.data ?? []
        setHighRiskCustomers(Array.isArray(d) ? d : [])
      }
      if (txRes.status === 'fulfilled') {
        const d = txRes.value?.data ?? []
        setFlaggedTransactions(Array.isArray(d) ? d : [])
      }
      if (sarRes.status === 'fulfilled') {
        const d = sarRes.value?.data ?? []
        setSarFilings(Array.isArray(d) ? d : [])
      }
      if (alertRes.status === 'fulfilled') {
        setHighSeverityAlerts(alertRes.value?.meta?.total ?? 0)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load AML surveillance metrics.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { void loadAmlData() }, 0)
    return () => clearTimeout(timer)
  }, [loadAmlData])

  const handleSarSuccess = (newSar: SarFiling) => {
    setSarFilings((prev) => [newSar, ...prev])
    setShowSarModal(false)
    showToast(`Suspicious Activity Report ${newSar.reference} recorded.`)
  }

  // Branch risk heatmap matrix - sourced from the risk-analysis payload
  const heatmapData: HeatmapBranchRisk[] = React.useMemo(() => {
    const branchRisk = riskData?.branch_risk
    if (!Array.isArray(branchRisk) || branchRisk.length === 0) return []

    return branchRisk.map((b) => ({
      branchId: b.branch_id,
      branchName: b.branch_name,
      lowCount: b.low_risk_customers ?? 0,
      mediumCount: b.medium_risk_customers ?? 0,
      highCount: b.high_risk_customers ?? 0,
      totalCount: b.total_customers ?? 0,
      riskScore: b.high_risk_percentage ?? 0,
    }))
  }, [riskData])

  // Calculated totals - sourced from the risk-analysis payload keys
  const totalFlaggedCount = riskData?.transaction_risk?.flagged_count ?? flaggedTransactions.length
  const totalFlaggedVolume = riskData?.transaction_risk?.flagged_volume ?? 0
  const highRiskCustCount = riskData?.customer_risk?.high_risk_count ?? highRiskCustomers.length
  const criticalAlerts = highSeverityAlerts

  // Real customer risk distribution from /dashboard/risk-analysis
  const riskDistribution = (() => {
    const total = riskData?.customer_risk?.total_customers ?? 0
    const low = riskData?.customer_risk?.low_risk_count ?? 0
    const medium = riskData?.customer_risk?.medium_risk_count ?? 0
    const high = riskData?.customer_risk?.high_risk_count ?? 0
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0)
    return {
      total,
      low,
      medium,
      high,
      lowPct: pct(low),
      mediumPct: pct(medium),
      highPct: pct(high),
    }
  })()

  const exportAmlReport = () => {
    const headers = ['SAR Reference', 'Customer Name', 'Customer ID', 'Category', 'Amount', 'Status', 'Filing Date']
    const rows = sarFilings.map((s) => [
      s.reference,
      `"${s.customer_name}"`,
      s.customer_number,
      `"${s.category}"`,
      s.amount,
      s.status,
      s.date,
    ])
    exportToCsv(`aml-surveillance-report-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    showToast('AML surveillance report exported.')
  }

  return (
    <div className="al-page">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="al-header">
        <div className="al-header-left">
          <h1 className="al-title">
            <Flame size={24} style={{ verticalAlign: 'middle', marginRight: 8, color: '#ef4444' }} />
            AML Risk &amp; Surveillance Dashboard
          </h1>
          <p className="al-subtitle">
            Anti-Money Laundering monitoring, suspicious transactions, SAR regulatory filings, and branch heatmaps.
          </p>
        </div>
        <div className="al-header-actions">
          <button className="al-btn al-btn-ghost" onClick={loadAmlData} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="al-btn al-btn-secondary" onClick={exportAmlReport}>
            <Download size={15} />
            Export AML Report
          </button>
          {['admin', 'compliance', 'manager'].includes(role) && (
            <button
              className="al-btn al-btn-primary"
              style={{ background: '#ef4444', borderColor: '#dc2626' }}
              onClick={() => setShowSarModal(true)}
            >
              <FileSpreadsheet size={15} />
              File SAR Report
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs for Alerts / KYC / AML */}
      <AlertNavTabs />

      {error && (
        <div className="al-alert-banner error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Ribbon KPI Stats */}
      <div className="al-stats-grid">
        <StatCard
          label="Suspicious Transactions"
          value={totalFlaggedCount}
          icon={<AlertTriangle size={20} />}
          color="#ef4444"
          bg="rgba(239,68,68,0.12)"
          accent="#ef4444"
          subtext={<span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4, fontWeight: 500 }}>${Number(totalFlaggedVolume).toLocaleString()} flagged volume</span>}
        />
        <StatCard
          label="High-Risk Customers"
          value={highRiskCustCount}
          icon={<ShieldAlert size={20} />}
          color="#f97316"
          bg="rgba(249,115,22,0.12)"
          accent="#f97316"
          subtext={<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Active under surveillance</span>}
        />
        <StatCard
          label="SAR Regulatory Filings"
          value={sarFilings.length}
          icon={<FileSpreadsheet size={20} />}
          color="#38bdf8"
          bg="rgba(56,189,248,0.12)"
          accent="#38bdf8"
          subtext={<span style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: 4, fontWeight: 500 }}>{sarFilings.filter((s) => s.status === 'filed').length} filed to FinCEN</span>}
        />
        <StatCard
          label="Critical Risk Alerts"
          value={criticalAlerts}
          icon={<Activity size={20} />}
          color="#a855f7"
          bg="rgba(168,85,247,0.12)"
          accent="#a855f7"
          subtext={<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Requiring immediate triage</span>}
        />
      </div>

      {/* Grid: Heatmap + Customer Risk Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Branch Risk Heatmap */}
        <div className="al-table-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} style={{ color: 'var(--primary-400)' }} />
                Branch AML Risk Heatmap
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Multi-dimensional risk exposure based on high-risk accounts, unusual velocity, and cross-border wires.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} /> Low
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} /> Medium
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} /> High
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {heatmapData.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Branch risk data unavailable.
              </div>
            ) : heatmapData.map((b) => (
              <div
                key={b.branchId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr 80px',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>
                    {b.branchName}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {b.totalCount} active accounts
                  </span>
                </div>

                {/* Low cell */}
                <div
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22c55e',
                    padding: '6px 10px',
                    borderRadius: 6,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {b.lowCount} Low
                </div>

                {/* Med cell */}
                <div
                  style={{
                    background: 'rgba(245,158,11,0.15)',
                    color: '#f59e0b',
                    padding: '6px 10px',
                    borderRadius: 6,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {b.mediumCount} Med
                </div>

                {/* High cell */}
                <div
                  style={{
                    background: b.highCount > 10 ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)',
                    color: '#ef4444',
                    padding: '6px 10px',
                    borderRadius: 6,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: b.highCount > 10 ? '1px solid rgba(239,68,68,0.4)' : 'none',
                  }}
                >
                  {b.highCount} High
                </div>

                {/* Risk score pill */}
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 12,
                      background:
                        b.riskScore > 40
                          ? 'rgba(239,68,68,0.2)'
                          : b.riskScore > 25
                          ? 'rgba(245,158,11,0.2)'
                          : 'rgba(34,197,94,0.2)',
                      color:
                        b.riskScore > 40 ? '#ef4444' : b.riskScore > 25 ? '#f59e0b' : '#22c55e',
                    }}
                  >
                    {b.riskScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Risk Distribution Card */}
        <div className="al-table-card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: '#38bdf8' }} />
            Customer Risk Distribution
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Categorized by automated KYC scoring, wire frequency, and PEP checks.
          </p>

          {/* Visual Progress bar */}
          <div
            style={{
              height: 12,
              borderRadius: 6,
              display: 'flex',
              overflow: 'hidden',
              marginBottom: 20,
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ width: `${riskDistribution.lowPct}%`, background: '#22c55e' }} title={`Low Risk: ${riskDistribution.lowPct}%`} />
            <div style={{ width: `${riskDistribution.mediumPct}%`, background: '#f59e0b' }} title={`Medium Risk: ${riskDistribution.mediumPct}%`} />
            <div style={{ width: `${riskDistribution.highPct}%`, background: '#ef4444' }} title={`High Risk: ${riskDistribution.highPct}%`} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: 8,
              }}
            >
              <div>
                <strong style={{ color: '#22c55e', fontSize: '0.85rem' }}>Low Risk (Standard)</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Routine banking, established employment
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{riskDistribution.lowPct}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  {riskDistribution.low} customers
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 8,
              }}
            >
              <div>
                <strong style={{ color: '#f59e0b', fontSize: '0.85rem' }}>Medium Risk (Elevated)</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Cash-intensive business, frequent wires
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{riskDistribution.mediumPct}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  {riskDistribution.medium} customers
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 8,
              }}
            >
              <div>
                <strong style={{ color: '#ef4444', fontSize: '0.85rem' }}>High Risk (Targeted)</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Foreign accounts, PEP, structuring flags
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{riskDistribution.highPct}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  {riskDistribution.high} customers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAR Regulatory Filings Pipeline Table */}
      <div className="al-table-card" style={{ marginBottom: 24 }}>
        <div className="al-table-toolbar">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet size={16} style={{ color: '#ef4444' }} />
              SAR Regulatory Filings &amp; Escalations
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Bank Secrecy Act / FinCEN suspicious activity reporting tracking
            </span>
          </div>
          {['admin', 'compliance', 'manager'].includes(role) && (
            <button
              className="al-btn al-btn-ghost al-btn-sm"
              onClick={() => setShowSarModal(true)}
              style={{ color: '#ef4444' }}
            >
              + File New SAR
            </button>
          )}
        </div>

        <div className="al-table-wrapper">
          <table className="al-table">
            <thead>
              <tr>
                <th>Report Ref</th>
                <th>Subject Customer</th>
                <th>Typology / Category</th>
                <th>Suspicious Amount</th>
                <th>Status</th>
                <th>Action Taken</th>
                <th>Filing Date</th>
              </tr>
            </thead>
            <tbody>
              {sarFilings.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-400)' }}>
                      {s.reference}
                    </span>
                  </td>
                  <td>
                    <strong>{s.customer_name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {s.customer_number}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.category}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#ef4444' }}>
                      ${Number(s.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>
                    <StatusBadge status={s.status} variant="sar" />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {s.action_taken}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Investigation Panels: High-Risk Customers & Flagged Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Panel 1: High-Risk Customers */}
        <div className="al-table-card">
          <div className="al-table-toolbar">
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={15} style={{ color: '#ef4444' }} />
              High-Risk Customer Watchlist ({highRiskCustomers.length})
            </h3>
            <Link to="/customers?risk_level=high" className="al-link-id" style={{ fontSize: '0.8rem' }}>
              View All
            </Link>
          </div>

          <div className="al-table-wrapper">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>KYC Status</th>
                  <th style={{ textAlign: 'right' }}>Profile</th>
                </tr>
              </thead>
              <tbody>
                {highRiskCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No high-risk customers identified.
                    </td>
                  </tr>
                ) : (
                  highRiskCustomers.slice(0, 8).map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/customers/${c.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {c.full_name}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          {c.customer_number}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.branch?.branch_name ?? 'Headquarters'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          status={c.kyc_status ?? 'pending'}
                          variant="kyc"
                          tone={c.kyc_status === 'verified' ? 'verified' : 'expired'}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/customers/${c.id}`} className="al-btn al-btn-ghost al-btn-sm" title="Investigate">
                          <Eye size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Flagged Transactions */}
        <div className="al-table-card">
          <div className="al-table-toolbar">
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
              Flagged Transactions Stream ({flaggedTransactions.length})
            </h3>
            <Link to="/transactions?status=flagged" className="al-link-id" style={{ fontSize: '0.8rem' }}>
              View All
            </Link>
          </div>

          <div className="al-table-wrapper">
            <table className="al-table">
              <thead>
                <tr>
                  <th>Transaction #</th>
                  <th>Type &amp; Channel</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {flaggedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No flagged transactions pending investigation.
                    </td>
                  </tr>
                ) : (
                  flaggedTransactions.slice(0, 8).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link to={`/transactions/${t.id}`} className="al-link-id">
                          {t.transaction_number}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          {t.account?.account_number ?? `Acc #${t.account_id}`}
                        </span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                          {t.transaction_type}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          via {t.channel ?? 'branch'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#ef4444' }}>
                          {formatMoney(t.amount)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/transactions/${t.id}`} className="al-btn al-btn-ghost al-btn-sm" title="View Transaction Details">
                          <ExternalLink size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* File SAR Modal */}
      {showSarModal && (
        <FileSarModal onClose={() => setShowSarModal(false)} onSuccess={handleSarSuccess} />
      )}
    </div>
  )
}
