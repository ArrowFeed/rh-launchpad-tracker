export function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  // A fixed locale ("en-US"), not the runtime's default — the server and
  // a visitor's browser can have different default locales, which made
  // this format differently between server-render and client hydration
  // and threw a hydration-mismatch error. Same fix applies everywhere
  // else toLocaleString/toLocaleTimeString is used in this project.
  if (abs >= 1_000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  if (abs >= 0.0001) return `$${n.toFixed(4)}`;
  return `$${n.toExponential(2)}`;
}

export function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
