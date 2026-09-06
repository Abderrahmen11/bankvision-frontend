import React from 'react'

export const DocsAccountsSection: React.FC = () => {
  return (
    <section id="accounts" className="docs-section">
      <span className="section-chapter">CHAPTER 03</span>
      <h2 className="docs-section-title">Accounts & Account Types</h2>
      <p>
        BankVision supports multiple account classifications tailored for retail, commercial, and escrow operations:
      </p>

      <div className="docs-table-wrapper">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Account Type</th>
              <th>Code Prefix</th>
              <th>Interest Compounding</th>
              <th>Daily Transfer Limit</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Checking</strong></td>
              <td><code>CHK-</code></td>
              <td>0.00% APY</td>
              <td>$25,000.00</td>
              <td>High-velocity daily operational transactions</td>
            </tr>
            <tr>
              <td><strong>Savings</strong></td>
              <td><code>SAV-</code></td>
              <td>3.85% APY</td>
              <td>$10,000.00</td>
              <td>Retail liquidity & interest accrual</td>
            </tr>
            <tr>
              <td><strong>Business Core</strong></td>
              <td><code>BUS-</code></td>
              <td>1.25% APY</td>
              <td>$500,000.00</td>
              <td>Corporate payroll & treasury management</td>
            </tr>
            <tr>
              <td><strong>Fixed Deposit</strong></td>
              <td><code>FD-</code></td>
              <td>5.20% APY</td>
              <td>Locked Term</td>
              <td>Guaranteed return term deposits</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
