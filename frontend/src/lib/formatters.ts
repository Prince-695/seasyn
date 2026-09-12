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

/**
 * Formats byte values into human-readable strings (B, KB, MB, GB).
 * Example: 1048576 -> "1 MB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const index = Math.min(i, sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`
}
