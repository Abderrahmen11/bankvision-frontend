import React from 'react'
import { ShieldCheck, LineChart, Landmark, FileSearch, Users, BellRing } from 'lucide-react'

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Compliance on rails',
    body: 'KYC and AML queues with document checks, SLA timers and automatic routing to the analyst who owns the case.',
    wide: true,
  },
  {
    icon: LineChart,
    title: 'Risk analytics',
    body: 'Exposure, delinquency and trend dashboards that refresh as transactions settle — not overnight.',
  },
  {
    icon: Landmark,
    title: 'Accounts & loans',
    body: 'The full lifecycle, from application to closure, handled in one console.',
  },
  {
    icon: FileSearch,
    title: 'Audit trail',
    body: 'Every action logged with actor, scope and timestamp. Export it whenever a regulator asks.',
    wide: true,
  },
  {
    icon: Users,
    title: 'Role-based access',
    body: 'Teller, analyst, auditor, admin — each sees exactly their slice of the bank, nothing more.',
  },
  {
    icon: BellRing,
    title: 'Live alerting',
    body: 'Threshold breaches and overdue reviews pushed to the owning team the moment they happen.',
  },
]

export const CapabilitiesSection: React.FC = () => (
  <section id="capabilities" className="lp-section">
    <div className="lp-section-inner">
      <div className="lp-section-head">
        <div>
          <p className="lp-kicker">
            <span className="lp-kicker-dot" />
            The platform
          </p>
          <h2 className="lp-h2">Six systems, retired into one</h2>
        </div>
        <p className="lp-section-note">
          Most banks stitch together six tools to do what BankVision does natively. Here is what
          comes in the box.
        </p>
      </div>

      <div className="lp-bento">
        {ITEMS.map(({ icon: Icon, title, body, wide }, index) => (
          <article key={title} className={`lp-cell${wide ? ' lp-cell-wide' : ''}`}>
            <div className="lp-cell-top">
              <span className="lp-cell-num">{String(index + 1).padStart(2, '0')}</span>
              <span className="lp-cell-icon">
                <Icon size={20} />
              </span>
            </div>
            <h3 className="lp-h3">{title}</h3>
            <p className="lp-body">{body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
)
