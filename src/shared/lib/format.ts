/**
 * Formate une date en français québécois.
 * Exemple: "15 juin 2026 · 18h00"
 */
export function formatDate(
  dateString: string,
  options: { time?: boolean } = {}
): string {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (options.time === false) return dateStr;

  const timeStr = date
    .toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(":", "h");

  return `${dateStr} · ${timeStr}`;
}

/**
 * Formate un montant en dollars canadiens.
 * Exemple: 7500 -> "75,00 $"
 */
export function formatCurrency(
  amountInCents: number,
  currency = "CAD"
): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);
}
