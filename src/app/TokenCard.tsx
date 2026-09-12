import Link from "next/link";
import Sparkline from "./Sparkline";

export type CardData = {
  contractAddress: string;
  symbol: string;
  name: string;
  launchpad: string;
  launchedAt: Date;
  graduationStatus: "BONDING" | "GRADUATED";
  price: number | null;
  mcap: number | null;
  volume24h: number;
  tradeCount: number;
  progress: number | null;
  sparkPoints: number[];
};

function fmtUsdLike(n: number | null) {
  if (n === null) return "—";
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// A stand-in avatar since Pons's launch event doesn't include an image —
// a colored initial is a reasonable placeholder until a launchpad that
// does provide artwork gets added.
function avatarColor(symbol: string) {
  let hash = 0;
  for (const c of symbol) hash = (hash * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${hash}, 55%, 40%)`;
}

export default function TokenCard({ data }: { data: CardData }) {
  const { contractAddress, symbol, name, launchpad, launchedAt, graduationStatus, mcap, volume24h, tradeCount, progress, sparkPoints } = data;

  return (
    <Link
      href={`/token/${contractAddress}`}
      className="block border border-zinc-800 rounded-lg p-3 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ backgroundColor: avatarColor(symbol) }}
        >
          {symbol.slice(0, 1)}
        </div>
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
          <div className="font-mono text-zinc-300">{fmtUsdLike(mcap)}</div>
        </div>
        <div>
          <div className="text-zinc-600 text-[10px] uppercase tracking-wide">Vol 24h</div>
          <div className="font-mono text-zinc-300">{fmtUsdLike(volume24h)}</div>
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
