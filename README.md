# BankVision — Frontend

The browser-based management dashboard for the BankVision banking platform, built with **React 19**, **TypeScript**, and **Vite**.

---

## Overview

BankVision Frontend is a role-aware single-page application (SPA) that consumes the BankVision Laravel API. It delivers purpose-built dashboard views for six distinct staff roles, along with modules for customers, accounts, transactions, loans, compliance, audit, and system configuration — all within a responsive, feature-rich interface.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 with React Compiler |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| Routing | React Router DOM 7 |
| Server State | TanStack Query (React Query) v5 |
| Client State | Zustand 5 |
| HTTP Client | Axios |
| Charts | Recharts |
| Dashboard Layouts | React Grid Layout |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Linting | ESLint 10 + TypeScript ESLint |

---

## Features

### Authentication & Security
- **Login page** with credential validation
- **Two-Factor Authentication (2FA)** — challenge screen with resend support
- **Session awareness** — auth state persisted and restored across page refreshes
- **Role-based route guards** — protected routes redirect unauthorized users

### Role-Based Dashboards
Each authenticated role lands on a dedicated dashboard tailored to their responsibilities:

| Role | Dashboard Focus |
|---|---|
| **Admin** | Full system overview, user management, system health |
| **Manager** | Branch operations, loan approvals, transaction overview |
| **Compliance** | AML alerts, SAR filings, KYC queue |
| **Analyst** | Analytics, risk analysis, financial reports |
| **CSR** | Customer service panel, account and transaction entry |
| **Auditor** | Audit log investigation, audit statistics |

- Dashboards are **drag-and-resize widget grids** (powered by React Grid Layout), with layouts saved per user on the server

### Core Banking Modules
- **Customers** — list, detail view, create/edit, linked accounts, loans, and transactions
- **Accounts** — multi-type account management, transaction history per account
- **Transactions** — transaction list and detail, approve/flag workflow
- **Loans** — loan lifecycle management with approval workflow
- **Branches** — multi-branch support with manager assignment

### Compliance & Risk
- **Alerts** — alert list, detail, assignment, and resolution workflow
- **KYC Queue** — customer document verification queue (`/alerts/kyc`)
- **AML Dashboard** — Anti-Money Laundering monitoring (`/alerts/aml`)
- **SAR Filings** — Suspicious Activity Report management
- **Audit Logs** — immutable activity log with detail view

### Analytics & Reporting
- **Risk Analysis / Reports** — financial metrics, risk indicators, and trend charts (accessible to Manager, Compliance, Analyst, Auditor, Admin)

### Settings
- **Profile** — update name, email, and avatar
- **Preferences** — per-user application preferences
- **Notifications** — notification preferences configuration
- **Security** — 2FA setup, active session management, login history
- **API Tokens** — personal access token management (admin only)
- **System Settings** — banking thresholds and interest rate configuration (admin only)

### General UX
- **Global Search** — client-side indexed search across all visible entities
- **In-App Notifications** — bell-icon feed with mark-read / mark-all-read
- **Public Landing Page** — marketing landing page at `/`
- **Public Documentation page** at `/docs`
- **Error pages** — 404 Not Found and 403 Unauthorized

---

## Project Structure

```
src/
├── app/
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   ├── providers/           # React context providers (QueryClient, Auth, etc.)
│   └── router/
│       └── AppRoutes.tsx    # Centralized route definitions with role guards
│
├── features/                # Feature-sliced modules (one folder per domain)
│   ├── auth/                # Login, 2FA, Unauthorized page
│   ├── dashboard/           # Role-specific dashboard views & widgets
│   ├── customers/           # Customer list & detail
│   ├── accounts/            # Account list & detail
│   ├── transactions/        # Transaction list & detail
│   ├── loans/               # Loan list & detail
│   ├── alerts/              # Alerts, KYC queue, AML dashboard
│   ├── audit/               # Audit log list & detail
│   ├── branches/            # Branch list & detail
│   ├── users/               # User list & detail
│   ├── reports/             # Risk analysis & financial reports
│   ├── settings/            # Profile, preferences, security, system config
│   ├── search/              # Global search
│   ├── landing/             # Public landing page
│   ├── docs/                # Public documentation page
│   └── errors/              # 404 / error pages
│
├── layouts/
│   └── MainLayout/          # Authenticated shell (sidebar, topbar, notifications)
│
├── shared/
│   ├── config/roles.ts      # Role constant arrays used by route guards
│   ├── hooks/               # Shared React hooks (useAuth, etc.)
│   ├── types/               # Shared TypeScript types (User, UserRole, …)
│   └── ...                  # Shared API clients, utilities, components
│
├── components/              # Global reusable UI components
├── store/                   # Zustand stores
└── styles/                  # Global CSS
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy the environment file and configure it
cp .env.example .env
```

### Environment Configuration

Edit `.env` with your local settings:

```env
# URL of the running BankVision backend API
VITE_API_BASE_URL=http://localhost:8000/api

VITE_APP_NAME=BankVision
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

> **Production note:** Set `VITE_API_BASE_URL` to the reverse-proxy path (e.g. `/api`) when the backend sits behind the same origin.

### Development Server

```bash
npm run dev
# App runs at http://localhost:5173
```

### Build for Production

```bash
npm run build
# Output in /dist
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## Routing & Route Guards

Routes are defined in [`src/app/router/AppRoutes.tsx`](src/app/router/AppRoutes.tsx) using two guard components:

- **`ProtectedRoute`** — requires an authenticated session; optionally restricts to specific roles via `allowedRoles`. Unauthorized users are redirected to `/unauthorized`.
- **`GuestRoute`** — redirects already-authenticated users away from public pages (e.g. `/login`) to their role's default route.

All protected routes are wrapped inside `MainLayout`, which renders the sidebar, topbar, and notification system.

---

## Deployment

The frontend is deployable as a static site. A [`vercel.json`](vercel.json) is included for one-command Vercel deployment:

```bash
vercel --prod
```

For other hosts (Nginx, Apache, S3+CloudFront), ensure all routes fall back to `index.html` to support client-side routing.

---

## License

MIT
