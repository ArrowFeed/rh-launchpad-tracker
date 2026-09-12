"use client";

import { useRouter } from "next/navigation";
import Sparkline from "./Sparkline";
import TokenAvatar from "./TokenAvatar";
import CopyButton from "./CopyButton";
import RelativeTime from "./RelativeTime";
import { fmtUsd } from "@/lib/format";

export type CardData = {
  contractAddress: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  launchpad: string;
  launchedAt: Date;
  creatorAddress: string;
  graduationStatus: "BONDING" | "GRADUATED";
  mcapUsd: number | null;
  volume24hUsd: number | null;
  tradeCount: number;
  progress: number | null;
  sparkPoints: number[];
};

function shortAddr(a: string) {
  return `${a.slice(0, 5)}…${a.slice(-4)}`;
}

// A plain clickable div rather than wrapping everything in <Link> — the
// card needs a copy-address button inside it, and a <button> nested
// inside an <a> is invalid HTML that browsers render inconsistently.
// This way the button is just a normal nested element with its own
// stopPropagation, no workaround needed.
export default function TokenCard({ data }: { data: CardData }) {
  const router = useRouter();
  const {
    contractAddress,
    symbol,
    name,
    imageUrl,
    launchpad,
    launchedAt,
    creatorAddress,
    graduationStatus,
    mcapUsd,
    volume24hUsd,
    tradeCount,
    progress,
    sparkPoints,
  } = data;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/token/${contractAddress}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/token/${contractAddress}`)}
      className="cursor-pointer border border-zinc-800 rounded-lg px-2.5 py-2 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2">
        <TokenAvatar imageUrl={imageUrl} symbol={symbol} size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-medium text-zinc-100 text-sm truncate">{symbol}</span>
            <span className="text-zinc-500 text-[11px] truncate">{name}</span>
            <CopyButton value={contractAddress} />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            <span className="font-mono">{shortAddr(creatorAddress)}</span>
            <span className="px-1 py-px rounded bg-zinc-800 text-zinc-400 ml-1">{launchpad}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-zinc-600 text-[10px]">
            <RelativeTime date={launchedAt} />
          </span>
          <div className="w-12 h-4">
            <Sparkline points={sparkPoints} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
        <span className="text-zinc-300">
          <span className="text-zinc-600">V</span> {fmtUsd(volume24hUsd)}
        </span>
        <span className="text-zinc-300">
          <span className="text-zinc-600">MC</span> {fmtUsd(mcapUsd)}
        </span>
        <span className="text-zinc-300">
          <span className="text-zinc-600">TX</span> {tradeCount}
        </span>
      </div>

      {graduationStatus === "BONDING" ? (
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${progress ?? 0}%` }} />
          </div>
          <span className="text-zinc-500 text-[10px] font-mono w-8 text-right">
            {progress !== null ? `${progress.toFixed(0)}%` : "—"}
          </span>
        </div>
      ) : (
        <div className="mt-1.5 text-[10px] text-green-400 font-medium">Graduated</div>
      )}
    </div>
  );
}
