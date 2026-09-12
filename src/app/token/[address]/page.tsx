import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { latestPrice, marketCap, volumeSince, graduationProgressPct, toUsd } from "@/lib/ponsMarket";
import { getEthUsdPrice } from "@/lib/ethPrice";
import { fmtUsd } from "@/lib/format";
import TokenAvatar from "../../TokenAvatar";
import PriceChart, { type PricePoint } from "./PriceChart";

export const dynamic = "force-dynamic";

function shortAddr(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default async function TokenDetail({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const [token, ethUsdPrice] = await Promise.all([
    prisma.token.findUnique({
      where: { contractAddress: address.toLowerCase() },
      include: { trades: { orderBy: { blockTime: "asc" } } },
    }),
    getEthUsdPrice(),
  ]);

  if (!token) notFound();

  const price = latestPrice(token.trades);
  const priceUsd = toUsd(price, token.quoteAsset, ethUsdPrice);
  const progress =
    token.graduationStatus === "GRADUATED"
      ? 100
      : token.curveAddress
      ? await graduationProgressPct(token.curveAddress, token.graduationThreshold)
      : null;

  const chartData: PricePoint[] = token.trades.map((t) => {
    const tokenAmount = Number(t.amountToken) / 1e18;
    const quoteAmount = Number(t.amountQuote) / 1e18;
    const p = tokenAmount > 0 ? quoteAmount / tokenAmount : 0;
    return {
      time: t.blockTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      price: toUsd(p, token.quoteAsset, ethUsdPrice) ?? p,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="text-zinc-500 text-sm hover:text-zinc-300">
            ← back to tracker
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <TokenAvatar imageUrl={token.imageUrl} symbol={token.symbol} size={40} />
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{token.symbol}</h1>
                <span className="text-zinc-400">{token.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {token.launchpad}
                </span>
              </div>
              <p className="text-zinc-500 text-xs font-mono mt-0.5">{token.contractAddress}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Price" value={fmtUsd(priceUsd)} />
          <Stat label="Market Cap" value={fmtUsd(toUsd(marketCap(price), token.quoteAsset, ethUsdPrice))} />
          <Stat
            label="24h Volume"
            value={fmtUsd(toUsd(volumeSince(token.trades, 24 * 60 * 60 * 1000), token.quoteAsset, ethUsdPrice))}
          />
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
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Token Amount</th>
                  <th className="px-4 py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...token.trades].reverse().map((tr) => {
                  const quoteAmount = Number(tr.amountQuote) / 1e18;
                  const usd = toUsd(quoteAmount, token.quoteAsset, ethUsdPrice);
                  return (
                    <tr key={tr.id} className="border-b border-zinc-900 last:border-0">
                      <td className="px-4 py-2">
                        <span className={tr.side === "BUY" ? "text-green-400" : "text-red-400"}>
                          {tr.side}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                        {shortAddr(tr.traderAddress)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-300">{fmtUsd(usd)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-300">
                        {(Number(tr.amountToken) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-zinc-500 text-xs">{tr.blockTime.toLocaleString("en-US")}</td>
                    </tr>
                  );
                })}
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
