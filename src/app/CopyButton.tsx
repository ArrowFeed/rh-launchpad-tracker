"use client";

import { useState } from "react";

// Positioned as a sibling of the card's <Link>, not nested inside it —
// nesting a button inside an anchor is invalid HTML and causes click
// handling bugs. This way the copy click never triggers navigation.
export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      title="Copy contract address"
      className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
    >
      {copied ? (
        <span className="text-[10px] text-green-400">✓</span>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}
