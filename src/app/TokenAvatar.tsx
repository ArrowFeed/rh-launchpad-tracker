"use client";

import { useState } from "react";

// Falls back to a colored initial if there's no image, the URL fails to
// load, or it's just slow — needs to be a client component since that
// depends on onLoad/onError handlers.
function avatarColor(symbol: string) {
  let hash = 0;
  for (const c of symbol) hash = (hash * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${hash}, 55%, 40%)`;
}

// A lot of tokens' logo() values are IPFS content — as a raw ipfs:// URI,
// a bare CID with no scheme at all, or (seen on RUFUS) an https:// URL
// already pointed at some other gateway. None of the first two load
// directly in a browser, and the third can still be unreliable (ipfs.io
// and dweb.link both came back rate-limited when tested). Every case gets
// normalized to filebase.io, the one gateway that responded fast and
// clean in that test.
const IPFS_GATEWAY = "https://ipfs.filebase.io/ipfs/";

function looksLikeBareCid(s: string): boolean {
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|ba[a-z0-9]{20,})/.test(s);
}

function resolveImageUrl(url: string): string {
  if (url.startsWith("ipfs://")) return IPFS_GATEWAY + url.slice("ipfs://".length);
  if (!url.startsWith("http") && looksLikeBareCid(url)) return IPFS_GATEWAY + url;
  const gatewayMatch = url.match(/\/ipfs\/(.+)$/);
  if (gatewayMatch) return IPFS_GATEWAY + gatewayMatch[1];
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
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const resolved = imageUrl ? resolveImageUrl(imageUrl) : null;
  const showImage = resolved && !failed;

  return (
    <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: size, height: size }}>
      {/* Always in the DOM underneath — visible until the real image has
          actually finished loading, so a slow or broken fetch never shows
          a native broken-image glyph or bare alt text. */}
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
        style={{ backgroundColor: avatarColor(symbol) }}
      >
        {symbol.slice(0, 1)}
      </div>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element -- external, per-token hosts; not worth configuring next/image's remote patterns for
        <img
          src={resolved}
          alt=""
          width={size}
          height={size}
          className="absolute inset-0 object-cover transition-opacity"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
