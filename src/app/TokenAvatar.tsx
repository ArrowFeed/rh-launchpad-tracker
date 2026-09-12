"use client";

import { useState } from "react";

// Falls back to a colored initial if there's no image, or the image URL
// fails to load (dead link, CDN hiccup) — needs to be a client component
// since that fallback depends on an onError handler.
function avatarColor(symbol: string) {
  let hash = 0;
  for (const c of symbol) hash = (hash * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${hash}, 55%, 40%)`;
}

// A lot of tokens' logo() values are IPFS content, either as an ipfs://
// URI or (seen in the wild) a bare CID with no scheme at all — neither
// loads directly in a browser, so both get routed through a public
// gateway. filebase.io responded fastest and most reliably of the
// gateways tested (cloudflare-ipfs.com didn't respond at all, ipfs.io and
// dweb.link were rate-limited).
const IPFS_GATEWAY = "https://ipfs.filebase.io/ipfs/";

function looksLikeBareCid(s: string): boolean {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|ba[a-z0-9]{20,})/.test(s);
}

function resolveImageUrl(url: string): string {
  if (url.startsWith("ipfs://")) return IPFS_GATEWAY + url.slice("ipfs://".length);
  if (!url.startsWith("http") && looksLikeBareCid(url)) return IPFS_GATEWAY + url;
  return url;
}

export default function TokenAvatar({
  imageUrl,
  symbol,
  size = 32,
}: {
  imageUrl: string | null;
  symbol: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ backgroundColor: avatarColor(symbol), width: size, height: size }}
      >
        {symbol.slice(0, 1)}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- external, per-token hosts; not worth configuring next/image's remote patterns for
  return (
    <img
      src={resolveImageUrl(imageUrl)}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full shrink-0 object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
