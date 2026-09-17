import React, { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 99.98, decimals: 2, suffix: '%', label: 'Uptime across regions' },
  { value: 4.2, decimals: 1, suffix: 'M', label: 'Transactions cleared daily' },
  { value: 38, decimals: 0, suffix: 's', label: 'Median KYC review time' },
  { value: 120, decimals: 0, suffix: '+', label: 'Branches & teams live' },
]

const format = (value: number, decimals: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const StatCounter: React.FC<{ stat: (typeof STATS)[number]; start: boolean }> = ({ stat, start }) => {
  const [shown, setShown] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? stat.value
      : 0
  )

  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    let frame = 0
    const totalFrames = 48
    let raf = 0
    const tick = () => {
      frame += 1
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3) // ease-out cubic
      setShown(stat.value * progress)
      if (frame < totalFrames) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, stat.value])

  return (
    <div className="lp-stat">
      <span className="lp-stat-value">
        {format(shown, stat.decimals)}
        {stat.suffix}
      </span>
      <span className="lp-stat-label">{stat.label}</span>
    </div>
  )
}

export const StatsRibbon: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStart(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="proof" className="lp-stats" aria-label="Platform statistics">
      <div className="lp-stats-inner" ref={ref}>
        {STATS.map((stat) => (
          <StatCounter key={stat.label} stat={stat} start={start} />
        ))}
      </div>
    </section>
  )
}
