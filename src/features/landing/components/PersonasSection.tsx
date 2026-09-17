import React from 'react'
import { UserRound, Building2, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const PERSONAS = [
  {
    icon: UserRound,
    index: '01',
    role: 'Branch & teller teams',
    headline: 'Customer conversations, not tab-switching',
    body: 'Look up any customer in seconds, open accounts through a guided flow, and service everyday requests — with sensitive actions gated to the right roles automatically.',
    points: ['Customer 360 view', 'Guided account opening', 'Permission-aware actions'],
  },
  {
    icon: Building2,
    index: '02',
    role: 'Analysts & risk teams',
    headline: 'Queues that tell you what matters first',
    body: 'AML cases, loan health and exposure analytics live in dashboards designed for long, focused review — with the highest-risk items always surfaced at the top.',
    points: ['Prioritised KYC / AML queues', 'Loan & exposure dashboards', 'Custom report builder'],
  },
  {
    icon: Scale,
    index: '03',
    role: 'Auditors & administrators',
    headline: 'Nothing happens off the record',
    body: 'Administrators manage users, roles and branches in one place; auditors get an immutable trail of every action, exportable for regulators on demand.',
    points: ['Immutable audit logs', 'User & role management', 'Regulator-ready exports'],
  },
]

export const PersonasSection: React.FC = () => (
  <section id="personas" className="lp-section lp-section-alt">
    <div className="lp-section-inner">
      <div className="lp-section-head">
        <div>
          <p className="lp-kicker">
            <span className="lp-kicker-dot" />
            Who it serves
          </p>
          <h2 className="lp-h2">One workspace, three vantage points</h2>
        </div>
      </div>

      <div className="lp-roles">
        {PERSONAS.map(({ icon: Icon, index, role, headline, body, points }, i) => (
          <article key={role} className={`lp-role${i % 2 === 1 ? ' lp-role-flip' : ''}`}>
            <div className="lp-role-meta">
              <span className="lp-role-index">{index}</span>
              <span className="lp-cell-icon">
                <Icon size={20} />
              </span>
              <span className="lp-role-tag">{role}</span>
            </div>
            <div className="lp-role-body">
              <h3 className="lp-h3 lp-role-headline">{headline}</h3>
              <p className="lp-body lp-role-copy">{body}</p>
              <ul className="lp-role-points">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link to="/login" className="lp-textlink">
                Explore this workspace
                <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
)
