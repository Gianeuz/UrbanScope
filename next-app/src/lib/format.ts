/** Formatting helpers (Philippine locale). */

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return peso.format(value);
}

export function formatPriceShort(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}M`;
  if (value >= 1_000) return `₱${Math.round(value / 1_000)}K`;
  return formatPrice(value);
}

export function formatArea(sqm: number | null | undefined): string {
  if (sqm == null) return "—";
  return `${Number.isInteger(sqm) ? sqm : sqm.toFixed(1)} sqm`;
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(d: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Removes diacritics and lower-cases — used for accent-insensitive search. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .trim();
}

export function slugify(s: string): string {
  return normalize(s).replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
