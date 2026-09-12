import Link from "next/link";
import Sparkline from "./Sparkline";
import TokenAvatar from "./TokenAvatar";
import { fmtUsd, relativeTime } from "@/lib/format";

export type CardData = {
  contractAddress: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  launchpad: string;
  launchedAt: Date;
  graduationStatus: "BONDING" | "GRADUATED";
  mcapUsd: number | null;
  volume24hUsd: number | null;
  tradeCount: number;
  progress: number | null;
  sparkPoints: number[];
};

export default function TokenCard({ data }: { data: CardData }) {
  const {
    contractAddress,
    symbol,
    name,
    imageUrl,
    launchpad,
    launchedAt,
    graduationStatus,
    mcapUsd,
    volume24hUsd,
    tradeCount,
    progress,
    sparkPoints,
  } = data;

  return (
    <Link
      href={`/token/${contractAddress}`}
      className="block border border-zinc-800 rounded-lg p-3 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <TokenAvatar imageUrl={imageUrl} symbol={symbol} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-medium text-zinc-100 text-sm truncate">{symbol}</span>
            <span className="text-zinc-500 text-xs truncate">{name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{launchpad}</span>
            <span className="text-[10px] text-zinc-600">{relativeTime(launchedAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Sparkline points={sparkPoints} />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <div>
          <div className="text-zinc-600 text-[10px] uppercase tracking-wide">MCap</div>
          <div className="font-mono text-zinc-300">{fmtUsd(mcapUsd)}</div>
        </div>
        <div>
          <div className="text-zinc-600 text-[10px] uppercase tracking-wide">Vol 24h</div>
          <div className="font-mono text-zinc-300">{fmtUsd(volume24hUsd)}</div>
        </div>
        <div>
          <div className="text-zinc-600 text-[10px] uppercase tracking-wide">Trades</div>
          <div className="font-mono text-zinc-300">{tradeCount}</div>
        </div>
      </div>

      {graduationStatus === "BONDING" && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${progress ?? 0}%` }} />
          </div>
          <span className="text-zinc-500 text-[10px] font-mono">
            {progress !== null ? `${progress.toFixed(0)}%` : "—"}
          </span>
        </div>
      )}
    </Link>
  );
}
