import React, { useState } from 'react'
import {
  FileText,
  Building,
  Scale,
  ArrowDownUp,
  Landmark,
  TrendingUp
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'
import type { ReportsData } from '@/features/reports'
import {
  formatCurrency,
  formatPercent,
  CHART_COLORS
} from '../reportHelpers'
import { ReportChartCard } from './ReportChartCard'

interface FinancialReportsTabProps {
  data: ReportsData
}

type FinancialSubTab = 'income' | 'balance' | 'cashflow' | 'branch'

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({ data }) => {
  const [subTab, setSubTab] = useState<FinancialSubTab>('income')
  const { income_statement, balance_sheet, cash_flow, branch_performance } = data

  const isNetIncomePositive = income_statement.net_income >= 0

  // Chart data for branch performance
  const branchChartData = (branch_performance || []).map(b => ({
    name: b.branch_name.replace(' Branch', '').replace(' Regional Office', ''),
    Deposits: b.total_deposits,
    Loans: b.total_loans,
    Volume: b.tx_volume
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ── Sub Tabs ── */}
      <div className="rp-sub-tabs">
        <button
          className={`rp-sub-tab ${subTab === 'income' ? 'active' : ''}`}
          onClick={() => setSubTab('income')}
        >
          <FileText size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Income Statement
        </button>
        <button
          className={`rp-sub-tab ${subTab === 'balance' ? 'active' : ''}`}
          onClick={() => setSubTab('balance')}
        >
          <Scale size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Balance Sheet
        </button>
        <button
          className={`rp-sub-tab ${subTab === 'cashflow' ? 'active' : ''}`}
          onClick={() => setSubTab('cashflow')}
        >
          <ArrowDownUp size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Cash Flow Statement
        </button>
        <button
          className={`rp-sub-tab ${subTab === 'branch' ? 'active' : ''}`}
          onClick={() => setSubTab('branch')}
        >
          <Building size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Branch Performance
        </button>
      </div>

      {/* ── 1. Income Statement ── */}
      {subTab === 'income' && (
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <Landmark size={18} color={CHART_COLORS.primary} />
              Statement of Comprehensive Income (P&amp;L)
            </h3>
            <span className="rp-badge rp-badge-info">GAAP Standard</span>
          </div>
          <div className="rp-card-body">
            <table className="rp-statement-table">
              <thead>
                <tr>
                  <th>Financial Line Item</th>
                  <th>Classification</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue Section */}
                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Operating Revenues</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Interest &amp; Financing Income (Loans)</td>
                  <td>Operating Revenue</td>
                  <td className="rp-positive">{formatCurrency(income_statement.revenue.interest_income)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Fee &amp; Commission Income (Wires, Accounts, Services)</td>
                  <td>Non-Interest Revenue</td>
                  <td className="rp-positive">{formatCurrency(income_statement.revenue.fee_income)}</td>
                </tr>
                <tr className="rp-statement-row-total">
                  <td>Total Gross Operating Revenue</td>
                  <td></td>
                  <td className="rp-positive">{formatCurrency(income_statement.revenue.total_revenue)}</td>
                </tr>

                {/* Expenses Section */}
                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Operating &amp; Financial Expenses</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Interest Expense on Customer Deposits</td>
                  <td>Cost of Funds</td>
                  <td className="rp-negative">{formatCurrency(income_statement.expenses.deposit_interest_expense)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Operational &amp; Administrative Overhead</td>
                  <td>Operating Expense (OPEX)</td>
                  <td className="rp-negative">{formatCurrency(income_statement.expenses.operating_costs)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Provision for Credit &amp; Loan Losses</td>
                  <td>Risk Provision</td>
                  <td className="rp-negative">{formatCurrency(income_statement.expenses.credit_provisions)}</td>
                </tr>
                <tr className="rp-statement-row-total">
                  <td>Total Operating Expenses</td>
                  <td></td>
                  <td className="rp-negative">{formatCurrency(income_statement.expenses.total_expenses)}</td>
                </tr>

                {/* Net Income Section */}
                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Earnings &amp; Taxes</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Operating Income Before Taxes (EBT)</td>
                  <td>Pre-Tax Income</td>
                  <td>{formatCurrency(income_statement.net_income_before_tax)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Income Tax Provision (Estimated 21%)</td>
                  <td>Corporate Taxes</td>
                  <td className="rp-negative">{formatCurrency(income_statement.tax_provision)}</td>
                </tr>
                <tr className="rp-statement-row-total" style={{ borderTop: '2px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <td>
                    <strong>Net Income / (Loss) for the Period</strong>
                  </td>
                  <td>
                    <span className="rp-badge rp-badge-neutral">
                      Margin: {formatPercent(income_statement.profit_margin)}
                    </span>
                  </td>
                  <td className={isNetIncomePositive ? 'rp-positive' : 'rp-negative'} style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    {formatCurrency(income_statement.net_income)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. Balance Sheet ── */}
      {subTab === 'balance' && (
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <Scale size={18} color={CHART_COLORS.info} />
              Statement of Financial Condition (Balance Sheet)
            </h3>
            <span className="rp-badge rp-badge-success">
              Assets = Liabilities + Equity
            </span>
          </div>
          <div className="rp-card-body">
            <table className="rp-statement-table">
              <thead>
                <tr>
                  <th>Category / Account</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Assets */}
                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Assets</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Cash, Cash Equivalents &amp; Central Bank Reserves</td>
                  <td>Liquid Assets</td>
                  <td>{formatCurrency(balance_sheet.assets.cash_and_reserves)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Net Loans &amp; Advances (Performing Portfolio)</td>
                  <td>Earning Assets</td>
                  <td>{formatCurrency(balance_sheet.assets.net_loans)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Other Assets (Fixed Assets, Accrued Income)</td>
                  <td>Other Assets</td>
                  <td>{formatCurrency(balance_sheet.assets.other_assets)}</td>
                </tr>
                <tr className="rp-statement-row-total" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
                  <td><strong>TOTAL ASSETS</strong></td>
                  <td></td>
                  <td><strong>{formatCurrency(balance_sheet.assets.total_assets)}</strong></td>
                </tr>

                {/* Liabilities */}
                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Liabilities</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Customer Demand &amp; Term Deposits</td>
                  <td>Deposit Liabilities</td>
                  <td>{formatCurrency(balance_sheet.liabilities.customer_deposits)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Other Liabilities &amp; Accrued Payables</td>
                  <td>Current Liabilities</td>
                  <td>{formatCurrency(balance_sheet.liabilities.other_liabilities)}</td>
                </tr>
                <tr className="rp-statement-row-total">
                  <td>Total Liabilities</td>
                  <td></td>
                  <td>{formatCurrency(balance_sheet.liabilities.total_liabilities)}</td>
                </tr>

                {/* Equity */}
                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Stockholders' Equity</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Regulatory Capital &amp; Common Stock</td>
                  <td>Core Tier 1 Capital</td>
                  <td>{formatCurrency(balance_sheet.equity.capital)}</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Retained Earnings &amp; Legal Reserves</td>
                  <td>Reserves</td>
                  <td>{formatCurrency(balance_sheet.equity.retained_earnings)}</td>
                </tr>
                <tr className="rp-statement-row-total">
                  <td>Total Stockholders' Equity</td>
                  <td></td>
                  <td>{formatCurrency(balance_sheet.equity.total_equity)}</td>
                </tr>

                {/* Balance Check */}
                <tr className="rp-statement-row-total" style={{ borderTop: '2px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <td><strong>TOTAL LIABILITIES &amp; EQUITY</strong></td>
                  <td></td>
                  <td>
                    <strong>
                      {formatCurrency(balance_sheet.liabilities.total_liabilities + balance_sheet.equity.total_equity)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. Cash Flow Statement ── */}
      {subTab === 'cashflow' && (
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <ArrowDownUp size={18} color={CHART_COLORS.warning} />
              Statement of Cash Flows (Indirect Method)
            </h3>
            <span className="rp-badge rp-badge-info">Monthly Liquidity</span>
          </div>
          <div className="rp-card-body">
            <table className="rp-statement-table">
              <thead>
                <tr>
                  <th>Cash Activity</th>
                  <th>Activity Type</th>
                  <th>Net Flow</th>
                </tr>
              </thead>
              <tbody>
                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Operating Activities</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Net Cash Provided by / (Used in) Core Banking Operations</td>
                  <td>Customer Transactions &amp; Net Interest</td>
                  <td className={cash_flow.operating >= 0 ? 'rp-positive' : 'rp-negative'}>
                    {formatCurrency(cash_flow.operating)}
                  </td>
                </tr>

                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Investing Activities</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Capital Investments, Technology &amp; Security Upgrades</td>
                  <td>Asset Acquisition</td>
                  <td className={cash_flow.investing >= 0 ? 'rp-positive' : 'rp-negative'}>
                    {formatCurrency(cash_flow.investing)}
                  </td>
                </tr>

                <tr className="rp-statement-row-section">
                  <td colSpan={3}>Financing Activities</td>
                </tr>
                <tr className="rp-statement-row-indent">
                  <td>Interbank Borrowing, Capital Injection &amp; Dividends</td>
                  <td>Capital Structure</td>
                  <td className={cash_flow.financing >= 0 ? 'rp-positive' : 'rp-negative'}>
                    {formatCurrency(cash_flow.financing)}
                  </td>
                </tr>

                <tr className="rp-statement-row-total" style={{ borderTop: '2px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <td><strong>NET INCREASE / (DECREASE) IN CASH RESERVES</strong></td>
                  <td></td>
                  <td className={cash_flow.net_change >= 0 ? 'rp-positive' : 'rp-negative'} style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    {formatCurrency(cash_flow.net_change)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Branch Performance ── */}
      {subTab === 'branch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Chart */}
          <ReportChartCard>
            <div className="rp-card-header">
              <h3 className="rp-card-title">
                <Building size={18} color={CHART_COLORS.primary} />
                Branch Comparison: Deposits vs. Loans Issued
              </h3>
            </div>
            <div className="rp-card-body">
              <div className="rp-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
                    <Tooltip
                      contentStyle={{ background: '#1a1f2e', borderColor: '#2d3748', borderRadius: '8px', color: '#f1f5f9' }}
                      formatter={(val) => [formatCurrency(Number(val) || 0)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Deposits" fill={CHART_COLORS.info} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Loans" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ReportChartCard>

          {/* Table */}
          <div className="rp-card">
            <div className="rp-card-header">
              <h3 className="rp-card-title">
                <TrendingUp size={18} color={CHART_COLORS.success} />
                Branch Operations &amp; Volume Metrics
              </h3>
              <span className="rp-badge rp-badge-neutral">{branch_performance?.length || 0} Branches</span>
            </div>
            <div className="rp-card-body" style={{ padding: 0 }}>
              <div className="rp-table-wrap">
                <table className="rp-data-table">
                  <thead>
                    <tr>
                      <th>Branch Name</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Customers</th>
                      <th>Total Deposits</th>
                      <th>Total Loans</th>
                      <th>Tx Volume</th>
                      <th>Tx Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(branch_performance || []).map((branch) => (
                      <tr key={branch.branch_id}>
                        <td>
                          <strong>{branch.branch_name}</strong>
                          {branch.manager && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Mgr: {branch.manager}</div>
                          )}
                        </td>
                        <td>{branch.city}</td>
                        <td>
                          <span className={`rp-badge ${branch.status === 'active' ? 'rp-badge-success' : 'rp-badge-neutral'}`}>
                            {branch.status}
                          </span>
                        </td>
                        <td>{branch.customer_count.toLocaleString()}</td>
                        <td style={{ color: '#3b82f6', fontWeight: 600 }}>{formatCurrency(branch.total_deposits, true)}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(branch.total_loans, true)}</td>
                        <td>{formatCurrency(branch.tx_volume, true)}</td>
                        <td>{branch.tx_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
