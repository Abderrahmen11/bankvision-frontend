import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Clock,
  ShieldAlert,
  Building,
  LayoutDashboard,
  Landmark,
  BarChart3,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/useAuthStore'
import { dashboardApi } from '@/features/dashboard'
import type { ReportsData, ReportFilterParams } from '@/features/reports'
import type { UserRole } from '@/shared/types/user'
import { getErrorMessage } from '@/shared/utils'
import {
  PERIOD_PRESETS,
  getAllowedTabs,
  canAccessReports,
  type ReportTab,
  type TabConfig
} from '../reportHelpers'
import {
  exportOverviewToCsv,
  exportTransactionsToCsv,
  exportLoansToCsv,
  exportRiskToCsv,
  exportFullReportToCsv,
  exportToExcel,
  exportReportToPdf
} from '../reportExportHelpers'
import { OverviewTab } from '../components/OverviewTab'
import { FinancialReportsTab } from '../components/FinancialReportsTab'
import { TransactionReportsTab } from '../components/TransactionReportsTab'
import { LoanReportsTab } from '../components/LoanReportsTab'
import { RiskReportsTab } from '../components/RiskReportsTab'
import { ScheduleReportModal } from '../modals/ScheduleReportModal'
import './Reports.css'

interface ReportsDashboardPageProps {
  defaultTab?: ReportTab
}

function getPeriodDates(period: ReportFilterParams['period']): { start: string; end: string } {
  const today = new Date()
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  const end = formatDate(today)
  const startDate = new Date(today)

  if (period === '7d') startDate.setDate(startDate.getDate() - 7)
  else if (period === '30d') startDate.setDate(startDate.getDate() - 30)
  else if (period === '90d') startDate.setDate(startDate.getDate() - 90)
  else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1)
  else if (period === 'ytd') return { start: `${today.getFullYear()}-01-01`, end }
  else if (period === 'all') return { start: '', end }

  return { start: formatDate(startDate), end }
}

export const ReportsDashboardPage: React.FC<ReportsDashboardPageProps> = ({
  defaultTab = 'overview'
}) => {
  const { user } = useAuthStore()
  const role: UserRole = user?.role || 'admin'

  const allowedTabs = getAllowedTabs(role)
  const initialTab = allowedTabs.some(t => t.id === defaultTab)
    ? defaultTab
    : allowedTabs[0]?.id || 'overview'

  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab)
  const [period, setPeriod] = useState<ReportFilterParams['period']>('30d')
  const initialDates = getPeriodDates('30d')
  const [startDate, setStartDate] = useState<string>(initialDates.start)
  const [endDate, setEndDate] = useState<string>(initialDates.end)
  const [branchId, setBranchId] = useState<string | number>(
    role === 'manager' && user?.branch?.id ? user.branch.id : ''
  )
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false)

  // Calculate preset dates
  const handlePeriodChange = (newPeriod: ReportFilterParams['period']) => {
    setPeriod(newPeriod)
    const dates = getPeriodDates(newPeriod)
    setStartDate(dates.start)
    setEndDate(dates.end)
  }

  // Fetch report data
  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: ReportFilterParams = {
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        branch_id: branchId ? Number(branchId) : undefined
      }

      const response = await dashboardApi.getReports(params)
      if (response) {
        setData(response)
      } else {
        toast.error('Failed to load analytical reports.')
      }
    } catch (err: unknown) {
      console.error('Reports fetch error:', err)
      toast.error(getErrorMessage(err, 'Error fetching report analytics'))
    } finally {
      setIsLoading(false)
    }
  }, [period, startDate, endDate, branchId])

  useEffect(() => {
    const timer = setTimeout(() => { void fetchReports() }, 0)
    return () => clearTimeout(timer)
  }, [fetchReports])

  if (!canAccessReports(role)) {
    return (
      <div className="rp-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="rp-card" style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ color: '#f1f5f9', fontSize: '1.3rem', margin: '0 0 0.5rem' }}>Access Restricted</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Customer Service Representatives (CSR) do not possess authorization to view financial statements or executive risk reporting. Please contact your system administrator.
          </p>
        </div>
      </div>
    )
  }

  // Exports
  const handleExportCsv = () => {
    if (!data) return
    try {
      if (activeTab === 'overview') exportOverviewToCsv(data)
      else if (activeTab === 'transactions') exportTransactionsToCsv(data)
      else if (activeTab === 'loans') exportLoansToCsv(data)
      else if (activeTab === 'risk') exportRiskToCsv(data)
      else exportFullReportToCsv(data)
      toast.success(`Exported ${activeTab} data to CSV`)
    } catch (err) {
      toast.error('CSV export failed')
    }
  }

  const handleExportExcel = () => {
    if (!data) return
    try {
      exportToExcel(data, activeTab)
      toast.success(`Exported ${activeTab} report to Excel`)
    } catch (err) {
      toast.error('Excel export failed')
    }
  }

  const handleExportPdf = () => {
    exportReportToPdf()
  }

  // Available branches list from performance or default list
  const availableBranches = data?.branch_performance || []

  const getTabIcon = (tabId: ReportTab) => {
    switch (tabId) {
      case 'overview': return <LayoutDashboard size={16} />
      case 'financial': return <Landmark size={16} />
      case 'transactions': return <BarChart3 size={16} />
      case 'loans': return <CreditCard size={16} />
      case 'risk': return <ShieldAlert size={16} />
      default: return <FileText size={16} />
    }
  }

  return (
    <div className="rp-page">
      {/* ── Page Header ── */}
      <div className="rp-header">
        <div className="rp-header-left">
          <h1>
            <FileText size={24} color="#6366f1" />
            Reports &amp; Analytics
          </h1>
          <p>
            Enterprise financial statements, transaction intelligence, loan portfolio health, and regulatory risk metrics.
          </p>
        </div>

        <div className="rp-header-actions">
          <button
            className="rp-export-btn rp-schedule-btn"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Clock size={15} />
            Schedule Report
          </button>
          <button
            className="rp-export-btn"
            onClick={fetchReports}
            disabled={isLoading}
            style={{ background: 'var(--bg-elevated)', color: '#94a3b8', border: '1px solid var(--border-subtle)' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Controls & Filter Bar ── */}
      <div className="rp-controls">
        {/* Period Presets */}
        <div className="rp-period-tabs">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.value}
              className={`rp-period-tab ${period === p.value ? 'active' : ''}`}
              onClick={() => handlePeriodChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="rp-date-inputs">
          <Calendar size={15} color="#64748b" />
          <input
            type="date"
            className="rp-date-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPeriod('all')
            }}
          />
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>to</span>
          <input
            type="date"
            className="rp-date-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPeriod('all')
            }}
          />
        </div>

        {/* Branch Scoping (for admin/auditor/analyst) */}
        {role !== 'manager' && (
          <div className="rp-branch-row" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building size={15} color="#64748b" />
            <select
              className="rp-date-input"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">All Branches</option>
              {availableBranches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rp-controls-spacer" />

        {/* Export Buttons */}
        <div className="rp-export-group">
          <button
            className="rp-export-btn rp-export-btn-csv"
            onClick={handleExportCsv}
            disabled={!data || isLoading}
            title="Export CSV data"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            className="rp-export-btn rp-export-btn-excel"
            onClick={handleExportExcel}
            disabled={!data || isLoading}
            title="Export Excel document"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            className="rp-export-btn rp-export-btn-pdf"
            onClick={handleExportPdf}
            title="Print or Save as PDF"
          >
            <Printer size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="rp-tabs">
        {allowedTabs.map((tab: TabConfig) => (
          <button
            key={tab.id}
            className={`rp-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {getTabIcon(tab.id)}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content Panes ── */}
      {isLoading && !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="rp-kpi-grid">
            <div className="rp-skeleton rp-skeleton-kpi" />
            <div className="rp-skeleton rp-skeleton-kpi" />
            <div className="rp-skeleton rp-skeleton-kpi" />
            <div className="rp-skeleton rp-skeleton-kpi" />
          </div>
          <div className="rp-skeleton rp-skeleton-chart" />
        </div>
      ) : !data ? (
        <div className="rp-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#94a3b8' }}>No analytical report data returned for the selected filter.</p>
          <button className="rp-export-btn" onClick={fetchReports} style={{ margin: '1rem auto 0' }}>
            Retry Loading
          </button>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && (
            <OverviewTab data={data} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'financial' && (
            <FinancialReportsTab data={data} />
          )}

          {activeTab === 'transactions' && (
            <TransactionReportsTab data={data} />
          )}

          {activeTab === 'loans' && (
            <LoanReportsTab data={data} />
          )}

          {activeTab === 'risk' && (
            <RiskReportsTab data={data} />
          )}
        </div>
      )}

      {/* ── Schedule Automated Report Modal ── */}
      <ScheduleReportModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
    </div>
  )
}

