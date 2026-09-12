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
      className="block border border-zinc-800 rounded-lg px-2.5 py-2 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2">
        <TokenAvatar imageUrl={imageUrl} symbol={symbol} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-medium text-zinc-100 text-sm truncate">{symbol}</span>
            <span className="text-zinc-500 text-[11px] truncate">{name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <span className="px-1 py-px rounded bg-zinc-800 text-zinc-400">{launchpad}</span>
            <span>{relativeTime(launchedAt)}</span>
          </div>
        </div>
        <div className="w-14 h-5 shrink-0">
          <Sparkline points={sparkPoints} />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
        <span className="text-zinc-300">
          <span className="text-zinc-600">MC</span> {fmtUsd(mcapUsd)}
        </span>
        <span className="text-zinc-300">
          <span className="text-zinc-600">V</span> {fmtUsd(volume24hUsd)}
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
    </Link>
  );
}
