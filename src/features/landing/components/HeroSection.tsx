import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const HIGHLIGHTS = [
  'KYC / AML review time cut from hours to minutes',
  'One ledger for accounts, loans and risk',
  'Role-scoped dashboards out of the box',
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── Live decorative dashboard mock ─────────────────────────────────────
   Everything below animates continuously: bars drift to new heights,
   KPIs tick, and the activity feed slides in fresh events. Purely
   decorative (aria-hidden), and fully frozen under reduced motion. */
const ACTIVITY_POOL = [
  { text: 'AML flag — acct #48213', badge: 'review', ok: false },
  { text: 'Loan approval — #L-9042', badge: 'done', ok: true },
  { text: 'Wire transfer — $128,400', badge: 'done', ok: true },
  { text: 'KYC docs received — #9114', badge: 'done', ok: true },
  { text: 'Branch report — Sfax', badge: 'done', ok: true },
  { text: 'AML flag — acct #51702', badge: 'review', ok: false },
  { text: 'Loan payout — #L-9051', badge: 'done', ok: true },
  { text: 'Threshold alert — FX desk', badge: 'review', ok: false },
]

const initialBars = [0.34, 0.52, 0.44, 0.68, 0.58, 0.86, 0.72]

const HeroMock: React.FC = () => {
  const [bars, setBars] = useState<number[]>(initialBars)
  const [assets, setAssets] = useState(8.4)
  const [queue, setQueue] = useState(12)
  const [feed, setFeed] = useState(ACTIVITY_POOL.slice(0, 3))
  const poolIndex = useRef(3)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const drift = (value: number, min: number, max: number, step: number) =>
      Math.min(max, Math.max(min, value + (Math.random() - 0.5) * 2 * step))

    const barsTimer = window.setInterval(() => {
      setBars((prev) => prev.map((v, i) => drift(v, 0.25, 0.95, i === 5 ? 0.06 : 0.18)))
    }, 1400)

    const assetsTimer = window.setInterval(() => {
      setAssets((prev) => drift(prev, 8.1, 8.8, 0.05))
    }, 2000)

    const queueTimer = window.setInterval(() => {
      setQueue((prev) => Math.round(drift(prev, 8, 16, 2)))
    }, 3400)

    const feedTimer = window.setInterval(() => {
      setFeed((prev) => {
        const next = ACTIVITY_POOL[poolIndex.current % ACTIVITY_POOL.length]
        poolIndex.current += 1
        return [next, ...prev].slice(0, 3)
      })
    }, 3000)

    return () => {
      window.clearInterval(barsTimer)
      window.clearInterval(assetsTimer)
      window.clearInterval(queueTimer)
      window.clearInterval(feedTimer)
    }
  }, [])

  return (
    <div className="lp-mock" aria-hidden="true">
      <div className="lp-mock-head">
        <span className="lp-mock-dot" />
        <span className="lp-mock-dot" />
        <span className="lp-mock-dot" />
        <span className="lp-mock-title">bankvision / overview</span>
        <span className="lp-live-pill">
          <span className="lp-live-dot" />
          live
        </span>
      </div>
      <div className="lp-mock-body">
        <div className="lp-mock-row">
          <div className="lp-mock-kpi">
            <span className="lp-mock-label">Assets under view</span>
            <span className="lp-mock-value">${assets.toFixed(2)}B</span>
            <span className="lp-mock-delta">+2.1% this week</span>
          </div>
          <div className="lp-mock-kpi">
            <span className="lp-mock-label">KYC queue</span>
            <span className="lp-mock-value">{queue}</span>
            <span className="lp-mock-delta lp-mock-delta-good">all within SLA</span>
          </div>
        </div>
        <div className="lp-mock-chart">
          {bars.map((scale, i) => (
            <span
              key={i}
              className={`lp-mock-bar${i === 5 ? ' lp-mock-bar-hot' : ''}`}
              style={{ transform: `scaleY(${scale.toFixed(3)})` }}
            />
          ))}
          <span className="lp-mock-scan" />
        </div>
        <div className="lp-mock-list">
          {feed.map((item, i) => (
            <div key={`${item.text}-${i}`} className="lp-mock-item" style={{ animationDelay: `${i * 60}ms` }}>
              <span>{item.text}</span>
              <span className={`lp-mock-badge${item.ok ? ' lp-mock-badge-ok' : ''}`}>{item.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const HeroSection: React.FC = () => (
  <section className="lp-hero">
    <div className="lp-hero-inner">
      <div className="lp-hero-copy">
        <p className="lp-kicker">
          <span className="lp-kicker-dot" />
          Banking operations, finally in one picture
        </p>
        <h1 className="lp-display">
          The command center for <em>every</em> branch, desk and audit room.
        </h1>
        <p className="lp-lede">
          BankVision brings accounts, loans, compliance queues and risk analytics into a single
          role-aware workspace — so your teams act on the same truth, in real time.
        </p>
        <div className="lp-hero-cta">
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">
            Sign in to the platform
            <ArrowRight size={17} />
          </Link>
          <a href="#capabilities" className="lp-btn lp-btn-outline lp-btn-lg">
            See how it works
          </a>
        </div>
        <ul className="lp-highlights">
          {HIGHLIGHTS.map((item) => (
            <li key={item}>
              <CheckCircle2 size={15} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <HeroMock />
    </div>
  </section>
)
