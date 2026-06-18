export function formatCurrency(amount: number): string {
  const n = Number(amount) || 0
  return "Rs " + n.toLocaleString("en-PK", { maximumFractionDigits: 0 })
}

export function formatNumber(amount: number): string {
  const n = Number(amount) || 0
  return n.toLocaleString("en-PK", { maximumFractionDigits: 2 })
}

export function formatDate(value: string | Date): string {
  const d = new Date(value)
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(value: string | Date): string {
  const d = new Date(value)
  return d.toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const a = new Date(from).getTime()
  const b = new Date(to).getTime()
  return Math.max(0, Math.floor((b - a) / (1000 * 60 * 60 * 24)))
}
