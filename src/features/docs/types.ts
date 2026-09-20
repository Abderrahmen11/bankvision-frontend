export interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'core' | 'security' | 'compliance' | 'loans' | 'api'
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'core',
    question: 'How does BankVision guarantee double-entry ledger consistency?',
    answer:
      'Every financial mutation in BankVision is executed within a database transaction wrapper using PostgreSQL ACID isolation. Debits and credits are recorded simultaneously in dedicated ledger journals. Idempotency keys are assigned to all clearing requests to prevent duplicate execution during network retries.',
  },
  {
    id: 'faq-2',
    category: 'security',
    question: 'What authentication mechanism is used for API requests?',
    answer:
      'BankVision utilizes Laravel Sanctum stateful and Bearer token authentication with configurable expiration windows. Every authenticated request includes an `Authorization: Bearer <token>` header, verified against active database tokens and role permissions on every endpoint invocation.',
  },
  {
    id: 'faq-3',
    category: 'compliance',
    question: 'How does the automated AML & KYC anomaly detection engine operate?',
    answer:
      'The compliance engine evaluates transactions in real-time against velocity thresholds, high-risk geographic corridors, and unusual volume multipliers. When an alert threshold is triggered (e.g. transfers exceeding $10,000 or 5x customer historical averages), a flagged alert is created and routed directly to the Compliance Officer review queue.',
  },
  {
    id: 'faq-4',
    category: 'loans',
    question: 'How are loan amortizations and interest schedules computed?',
    answer:
      'Loans support standard reducing-balance and fixed interest rate models. The engine automatically generates month-by-month repayment amortization schedules detailing principal breakdown, monthly interest charges, outstanding balances, and penalty calculation algorithms for late disbursements.',
  },
  {
    id: 'faq-5',
    category: 'security',
    question: 'Are system audit logs immutable?',
    answer:
      'Yes. Audit trails record user identity, IP address, user agent, target model, action type (create, update, delete, status_change), and timestamped before/after JSON diffs. Audit log records have write-only permissions on creation and cannot be modified or deleted through standard API endpoints.',
  },
  {
    id: 'faq-6',
    category: 'core',
    question: 'What institutional role personas are available in the platform?',
    answer:
      'BankVision provides 6 distinct role personas out-of-the-box: System Administrator (full platform oversight), Branch Manager (branch operations & loan approvals), Compliance Officer (AML/KYC investigation), Customer Service Rep (teller & account onboarding), Financial Analyst (portfolio modeling), and Internal Auditor (read-only audit trails).',
  },
  {
    id: 'faq-7',
    category: 'api',
    question: 'What is the standard API response structure?',
    answer:
      'All API responses follow a uniform JSON structure containing `success: boolean`, `message?: string`, `data: object | array`, and `meta?: { current_page, total, per_page }` for paginated collections. Error responses provide descriptive validation error bags under the `errors` key with appropriate HTTP status codes (400, 401, 403, 404, 422, 500).',
  },
  {
    id: 'faq-8',
    category: 'core',
    question: 'Can BankVision support multiple branch locations?',
    answer:
      'Yes. The system incorporates a multi-branch architecture. Employees, customer accounts, cash drawers, and loan portfolios can be partitioned by branch codes with cross-branch transfer capabilities and centralized administrative visibility.',
  },
]
