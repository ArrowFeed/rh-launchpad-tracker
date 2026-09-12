import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { latestPrice, marketCap, volumeSince, graduationProgressPct } from "@/lib/ponsMarket";
import PriceChart, { type PricePoint } from "./PriceChart";

export const dynamic = "force-dynamic";

function shortAddr(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function fmtUsdLike(n: number | null) {
  if (n === null) return "—";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default async function TokenDetail({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const token = await prisma.token.findUnique({
    where: { contractAddress: address.toLowerCase() },
    include: { trades: { orderBy: { blockTime: "asc" } } },
  });

  if (!token) notFound();

  const price = latestPrice(token.trades);
  const progress =
    token.graduationStatus === "GRADUATED"
      ? 100
      : token.curveAddress
      ? await graduationProgressPct(token.curveAddress, token.graduationThreshold)
      : null;

  const chartData: PricePoint[] = token.trades.map((t) => {
    const tokenAmount = Number(t.amountToken) / 1e18;
    const quoteAmount = Number(t.amountQuote) / 1e18;
    return {
      time: t.blockTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      price: tokenAmount > 0 ? quoteAmount / tokenAmount : 0,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="text-zinc-500 text-sm hover:text-zinc-300">
            ← back to tracker
          </Link>
          <div className="flex items-baseline gap-3 mt-2">
            <h1 className="text-2xl font-semibold tracking-tight">{token.symbol}</h1>
            <span className="text-zinc-400">{token.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              {token.launchpad}
            </span>
          </div>
          <p className="text-zinc-500 text-xs font-mono mt-1">{token.contractAddress}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Price" value={price !== null ? `${fmtUsdLike(price)} quote` : "—"} />
          <Stat label="Market Cap" value={fmtUsdLike(marketCap(price))} />
          <Stat label="24h Volume" value={fmtUsdLike(volumeSince(token.trades, 24 * 60 * 60 * 1000))} />
          <Stat
            label="Status"
            value={
              token.graduationStatus === "GRADUATED"
                ? "Graduated"
                : progress !== null
                ? `${progress.toFixed(1)}% to graduation`
                : "Bonding"
            }
          />
        </div>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Price</h2>
          <PriceChart data={chartData} />
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">
            Trade history ({token.trades.length})
          </h2>
          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800 text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 font-medium">Side</th>
                  <th className="px-4 py-2 font-medium">Trader</th>
                  <th className="px-4 py-2 font-medium">Quote Amount</th>
                  <th className="px-4 py-2 font-medium">Token Amount</th>
                  <th className="px-4 py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...token.trades].reverse().map((tr) => (
                  <tr key={tr.id} className="border-b border-zinc-900 last:border-0">
                    <td className="px-4 py-2">
                      <span className={tr.side === "BUY" ? "text-green-400" : "text-red-400"}>
                        {tr.side}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                      {shortAddr(tr.traderAddress)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-300">
                      {(Number(tr.amountQuote) / 1e18).toFixed(6)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-300">
                      {(Number(tr.amountToken) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">
                      {tr.blockTime.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {token.trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-sm">
                      No trades recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-medium mt-1 font-mono">{value}</div>
    </div>
  );
}
