import { useEffect, type RefObject } from 'react'

/**
 * Copies `<thead th>` header texts onto every `<tbody td>` as `data-label`.
 * The mobile stylesheet turns tables into stacked cards and renders each
 * label via `td::before { content: attr(data-label) }`.
 *
 * Runs against all tables inside the content container (list pages, detail
 * pages and dashboard widgets) and re-applies whenever React swaps rows
 * (pagination, sorting, data refreshes). Desktop is unaffected — the CSS
 * only activates below 768px.
 */
export function useResponsiveTableLabels(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let frame = 0

    const apply = () => {
      root.querySelectorAll('table').forEach((table) => {
        const headers = Array.from(table.querySelectorAll('thead th'))
        if (headers.length === 0) return
        const labels = headers.map(
          (th) => th.textContent?.replace(/[↑↓↕]/g, '').replace(/\s+/g, ' ').trim() ?? ''
        )
        table.querySelectorAll('tbody tr').forEach((tr) => {
          Array.from(tr.children).forEach((cell, i) => {
            const label = labels[i]
            if (label && cell instanceof HTMLElement) {
              cell.dataset.label = label
            }
          })
        })
      })
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    }

    schedule()
    const observer = new MutationObserver(schedule)
    observer.observe(root, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [rootRef])
}
