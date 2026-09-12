import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { latestPrice, marketCap, volumeSince, graduationProgressPct } from "@/lib/ponsMarket";

// Without this, Next.js would run the database query once at build time
// and bake that snapshot into a static page — the table would never
// update as the indexer adds new tokens. This forces a fresh query on
// every page load instead.
export const dynamic = "force-dynamic";

function shortAddr(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function fmtUsdLike(n: number | null) {
  if (n === null) return "—";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function Home() {
  const tokens = await prisma.token.findMany({
    orderBy: { launchedAt: "desc" },
    include: { trades: { orderBy: { blockTime: "asc" } } },
  });

  const rows = await Promise.all(
    tokens.map(async (t) => {
      const price = latestPrice(t.trades);
      const progress =
        t.graduationStatus === "GRADUATED"
          ? 100
          : t.curveAddress
          ? await graduationProgressPct(t.curveAddress, t.graduationThreshold)
          : null;
      return {
        token: t,
        price,
        mcap: marketCap(price),
        volume24h: volumeSince(t.trades, 24 * 60 * 60 * 1000),
        tradeCount: t.trades.length,
        progress,
      };
    })
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Robinhood Chain Launchpad Tracker
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Live token launches across Robinhood Chain&apos;s bonding-curve launchpads.
            Currently tracking <span className="text-zinc-200 font-medium">Pons</span> — hood.fun and Pools.trade coming next.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {rows.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No tokens indexed yet — the indexer needs to be running for data to show up here.
          </p>
        ) : (
          <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-900/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Market Cap</th>
                  <th className="px-4 py-3 font-medium">24h Volume</th>
                  <th className="px-4 py-3 font-medium">Trades</th>
                  <th className="px-4 py-3 font-medium">Graduation</th>
                  <th className="px-4 py-3 font-medium">Launched</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ token: t, price, mcap, volume24h, tradeCount, progress }) => (
                  <tr
                    key={t.id}
                    className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/token/${t.contractAddress}`} className="block">
                        <span className="font-medium text-zinc-100">{t.symbol}</span>{" "}
                        <span className="text-zinc-500">{t.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {price !== null ? `${fmtUsdLike(price)} quote` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {mcap !== null ? fmtUsdLike(mcap) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {fmtUsdLike(volume24h)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{tradeCount}</td>
                    <td className="px-4 py-3">
                      {t.graduationStatus === "GRADUATED" ? (
                        <span className="text-green-400 text-xs font-medium">Graduated</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400"
                              style={{ width: `${progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-zinc-500 text-xs">
                            {progress !== null ? `${progress.toFixed(1)}%` : "—"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {relativeTime(t.launchedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
