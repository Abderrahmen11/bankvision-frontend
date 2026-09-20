/**
 * Fixed display currency: Tunisian Dinar (TND) — symbol "DT" after the
 * amount, 3 decimals (millimes). Not configurable.
 *
 * The optional second parameter is accepted for call-site compatibility
 * (legacy per-row currency overrides) and intentionally ignored.
 */
export function formatMoney(
  amount: number | string | undefined | null,
  _legacyCurrencyOverride?: unknown
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (Number.isNaN(num)) return '—'

  const formatted = Math.abs(num)
    .toFixed(3)
    .replace('.', '@')
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ')
    .replace('@', '.')

  const body = num < 0 ? `-${formatted}` : formatted
  return `${body} DT`
}

/**
 * Single safe boundary for turning backend decimal strings (or legacy
 * numbers) into a JS number for arithmetic and comparisons. Backend
 * serializes monetary decimals as strings to avoid float drift; never do
 * string math (`sum + balance` concatenates) — parse here first.
 */
export function toAmountNumber(
  value: number | string | undefined | null
): number {
  if (value === undefined || value === null || value === '') return 0
  const num = typeof value === 'number' ? value : parseFloat(value)
  return Number.isNaN(num) ? 0 : num
}
