export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "0s"
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)

  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(" ")
}

/**
 * Formats a timestamp into a standard display date.
 * Example: "Oct 25, 2024, 10:30 AM"
 */
export function formatDate(timestamp: string | Date | number): string {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date)
}

/**
 * Formats large numbers compactly.
 * Example: 1250200 -> "1.25M"
 */
export function formatCompactNumber(num: number): string {
  if (num === undefined || num === null) return "0"
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num)
}
