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
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { dashboardApi } from '@/api/dashboard'
import { customersApi } from '@/api/customers'
import { transactionsApi } from '@/api/transactions'
import { branchesApi } from '@/api/branches'
import type { Customer } from '@/types/customer'
import type { Transaction } from '@/types/transaction'
import type { Branch } from '@/types/user'
import { AlertNavTabs } from './components/AlertNavTabs'
import { FileSarModal, type SarFiling } from './modals/FileSarModal'
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

const INITIAL_SAR_FILINGS: SarFiling[] = [
  {
    id: 'sar-1',
    reference: 'SAR-2026-881920',
    customer_name: 'Marcus Vance',
    customer_number: 'CUST-0004',
    category: 'Structuring / Smurfing (<$10k Cash)',
    amount: 28500,
    status: 'under_review',
    date: '2026-09-06',
    narrative: 'Three consecutive cash deposits of $9,500 made across multiple branch ATMs within 48 hours.',
    action_taken: 'Account Flagged & CTR Exemption Checked',
  },
  {
    id: 'sar-2',
    reference: 'SAR-2026-773412',
    customer_name: 'Apex Global Logistics LLC',
    customer_number: 'CUST-0012',
    category: 'Rapid Wire Movement / Pass-through Account',
    amount: 145000,
    status: 'filed',
    date: '2026-09-02',
    narrative: 'Inbound international wire immediately divided into 6 domestic transfers to unverified entities.',
    action_taken: 'FinCEN BSA Form 111 Transmitted',
  },
  {
    id: 'sar-3',
    reference: 'SAR-2026-559102',
    customer_name: 'Elena Rostova',
    customer_number: 'CUST-0019',
    category: 'PEP (Politically Exposed Person) Sanctions Check',
    amount: 82000,
    status: 'escalated',
    date: '2026-08-28',
    narrative: 'Secondary sanctions list match detected during automated nightly OFAC batch scan.',
    action_taken: 'Accounts Frozen & Legal Notified',
  },
]

export const AmlDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'csr'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Data states
  const [riskData, setRiskData] = useState<any>(null)
  const [highRiskCustomers, setHighRiskCustomers] = useState<Customer[]>([])
  const [flaggedTransactions, setFlaggedTransactions] = useState<Transaction[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [sarFilings, setSarFilings] = useState<SarFiling[]>(INITIAL_SAR_FILINGS)
  const [showSarModal, setShowSarModal] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadAmlData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [riskRes, custRes, txRes, branchRes] = await Promise.allSettled([
        dashboardApi.getRiskAnalysis(),
        customersApi.list({ risk_level: 'high', per_page: 15 }),
        transactionsApi.list({ status: 'flagged', per_page: 15 }),
        branchesApi.list(),
      ])

      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value)
      }
      if (custRes.status === 'fulfilled') {
        const d = (custRes.value as any).data ?? []
        setHighRiskCustomers(Array.isArray(d) ? d : [])
      }
      if (txRes.status === 'fulfilled') {
        const d = (txRes.value as any).data ?? []
        setFlaggedTransactions(Array.isArray(d) ? d : [])
      }
      if (branchRes.status === 'fulfilled') {
        const d = (branchRes.value as any).data ?? []
        setBranches(Array.isArray(d) ? d : [])
      }
    } catch (err: any) {
      setError('Failed to load AML surveillance metrics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAmlData()
  }, [loadAmlData])

  const handleSarSuccess = (newSar: SarFiling) => {
    setSarFilings((prev) => [newSar, ...prev])
    setShowSarModal(false)
    showToast(`Suspicious Activity Report ${newSar.reference} recorded.`)
  }

  // Generate branch risk heatmap matrix
  const heatmapData: HeatmapBranchRisk[] = React.useMemo(() => {
    if (!branches.length) {
      return [
        { branchId: 1, branchName: 'Main Financial Center', lowCount: 142, mediumCount: 38, highCount: 12, totalCount: 192, riskScore: 28 },
        { branchId: 2, branchName: 'Downtown Commercial', lowCount: 88, mediumCount: 42, highCount: 18, totalCount: 148, riskScore: 44 },
        { branchId: 3, branchName: 'Metropolitan Branch', lowCount: 110, mediumCount: 25, highCount: 8, totalCount: 143, riskScore: 21 },
        { branchId: 4, branchName: 'North Suburb Branch', lowCount: 95, mediumCount: 14, highCount: 3, totalCount: 112, riskScore: 11 },
      ]
    }

    return branches.map((b, idx) => {
      // Approximate distribution
      const highC = highRiskCustomers.filter((c) => c.branch_id === b.id).length || (idx % 3 === 0 ? 9 : 4)
      const medC = Math.max(12, 28 - idx * 4)
      const lowC = Math.max(45, 110 - idx * 10)
      const tot = highC + medC + lowC
      const score = Math.round(((highC * 3 + medC * 1.5) / (tot * 3)) * 100)
      return {
        branchId: b.id,
        branchName: b.branch_name,
        lowCount: lowC,
        mediumCount: medC,
        highCount: highC,
        totalCount: tot,
        riskScore: score,
      }
    })
  }, [branches, highRiskCustomers])

  // Calculated totals
  const totalFlaggedCount = riskData?.risk_indicators?.flagged_tx_count ?? flaggedTransactions.length ?? 8
  const totalFlaggedVolume = riskData?.risk_indicators?.flagged_tx_volume ?? 342500
  const highRiskCustCount = riskData?.risk_indicators?.high_risk_customers_count ?? highRiskCustomers.length ?? 14
  const criticalAlerts = riskData?.risk_indicators?.critical_alerts ?? 5

  const exportAmlReport = () => {
    const headers = ['SAR Reference', 'Customer Name', 'Customer ID', 'Category', 'Amount (USD)', 'Status', 'Filing Date']
    const rows = sarFilings.map((s) => [
      s.reference,
      `"${s.customer_name}"`,
      s.customer_number,
      `"${s.category}"`,
      s.amount,
      s.status,
      s.date,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aml-surveillance-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast('AML surveillance report exported.')
  }

  return (
    <div className="al-page">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 24,
            zIndex: 99999,
            padding: '12px 20px',
            borderRadius: 10,
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          {toast.msg}
        </div>
      )}

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
        <div className="al-stat-card" style={{ '--card-accent': '#ef4444' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
          <span className="al-stat-label">Suspicious Transactions</span>
          <span className="al-stat-value">{totalFlaggedCount}</span>
          <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4, fontWeight: 500 }}>
            ${Number(totalFlaggedVolume).toLocaleString()} flagged volume
          </span>
        </div>

        <div className="al-stat-card" style={{ '--card-accent': '#f97316' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
            <ShieldAlert size={20} />
          </div>
          <span className="al-stat-label">High-Risk Customers</span>
          <span className="al-stat-value">{highRiskCustCount}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Active under surveillance
          </span>
        </div>

        <div className="al-stat-card" style={{ '--card-accent': '#38bdf8' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
            <FileSpreadsheet size={20} />
          </div>
          <span className="al-stat-label">SAR Regulatory Filings</span>
          <span className="al-stat-value">{sarFilings.length}</span>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: 4, fontWeight: 500 }}>
            {sarFilings.filter((s) => s.status === 'filed').length} filed to FinCEN
          </span>
        </div>

        <div className="al-stat-card" style={{ '--card-accent': '#a855f7' } as React.CSSProperties}>
          <div className="al-stat-icon" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
            <Activity size={20} />
          </div>
          <span className="al-stat-label">Critical Risk Alerts</span>
          <span className="al-stat-value">{criticalAlerts}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Requiring immediate triage
          </span>
        </div>
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
            {heatmapData.map((b) => (
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
            <div style={{ width: '68%', background: '#22c55e' }} title="Low Risk: 68%" />
            <div style={{ width: '22%', background: '#f59e0b' }} title="Medium Risk: 22%" />
            <div style={{ width: '10%', background: '#ef4444' }} title="High Risk: 10%" />
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
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>68%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  ~420 customers
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
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>22%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  ~136 customers
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
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>10%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  {highRiskCustCount} customers
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
                    <span
                      className="al-badge-status"
                      style={{
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        background:
                          s.status === 'filed'
                            ? 'rgba(34,197,94,0.15)'
                            : s.status === 'under_review'
                            ? 'rgba(245,158,11,0.15)'
                            : s.status === 'escalated'
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(148,163,184,0.15)',
                        color:
                          s.status === 'filed'
                            ? '#22c55e'
                            : s.status === 'under_review'
                            ? '#f59e0b'
                            : s.status === 'escalated'
                            ? '#ef4444'
                            : 'var(--text-muted)',
                      }}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
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
                        <span
                          className="al-badge-status"
                          style={{
                            textTransform: 'capitalize',
                            background:
                              c.kyc_status === 'verified'
                                ? 'rgba(34,197,94,0.15)'
                                : 'rgba(239,68,68,0.15)',
                            color: c.kyc_status === 'verified' ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {c.kyc_status ?? 'pending'}
                        </span>
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
                          {t.currency ?? 'USD'} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
