/**
 * English-only date/time formatting (the platform is English-only).
 * Kept as a shared helper so every module formats dates consistently.
 */
export function formatDateLocale(
  dateStr: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  if (!dateStr) return '—'
  try {
    const value = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr.replace(' ', 'T'))
    if (Number.isNaN(value.getTime())) return dateStr
    return new Intl.DateTimeFormat('en-US', options).format(value)
  } catch {
    return dateStr
  }
}

