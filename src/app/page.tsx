import { prisma } from "@/lib/prisma";
import { latestPrice, marketCap, volumeSince, graduationProgressPct, toUsd } from "@/lib/ponsMarket";
import { getEthUsdPrice } from "@/lib/ethPrice";
import TokenCard, { type CardData } from "./TokenCard";

// Without this, Next.js would run the database query once at build time
// and bake that snapshot into a static page — the columns would never
// update as the indexer adds new tokens. This forces a fresh query on
// every page load instead.
export const dynamic = "force-dynamic";

// Tokens closer to graduation than this move from "New Pairs" into
// "Final Stretch" — a rough split, not a precise threshold from any
// launchpad's own rules.
const FINAL_STRETCH_THRESHOLD = 70;

async function loadCards(): Promise<CardData[]> {
  const [tokens, ethUsdPrice] = await Promise.all([
    prisma.token.findMany({ include: { trades: { orderBy: { blockTime: "asc" } } } }),
    getEthUsdPrice(),
  ]);

  return Promise.all(
    tokens.map(async (t) => {
      const price = latestPrice(t.trades);
      const progress =
        t.graduationStatus === "GRADUATED"
          ? 100
          : t.curveAddress
          ? await graduationProgressPct(t.curveAddress, t.graduationThreshold)
          : null;

      // Last 20 trades' implied prices — enough for a sparkline to show a
      // real shape without pulling in a token's entire trade history.
      const recentTrades = t.trades.slice(-20);
      const sparkPoints = recentTrades
        .map((tr) => {
          const tokenAmount = Number(tr.amountToken) / 1e18;
          const quoteAmount = Number(tr.amountQuote) / 1e18;
          return tokenAmount > 0 ? quoteAmount / tokenAmount : null;
        })
        .filter((p): p is number => p !== null);

      return {
        contractAddress: t.contractAddress,
        symbol: t.symbol,
        name: t.name,
        imageUrl: t.imageUrl,
        launchpad: t.launchpad,
        launchedAt: t.launchedAt,
        graduationStatus: t.graduationStatus,
        mcapUsd: toUsd(marketCap(price), t.quoteAsset, ethUsdPrice),
        volume24hUsd: toUsd(volumeSince(t.trades, 24 * 60 * 60 * 1000), t.quoteAsset, ethUsdPrice),
        tradeCount: t.trades.length,
        progress,
        sparkPoints,
      };
    })
  );
}

function Column({ title, subtitle, cards }: { title: string; subtitle: string; cards: CardData[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 mb-3 px-1">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        <span className="text-zinc-600 text-xs">{subtitle}</span>
        <span className="ml-auto text-zinc-600 text-xs">{cards.length}</span>
      </div>
      <div className="space-y-2">
        {cards.length === 0 ? (
          <p className="text-zinc-600 text-xs px-1">Nothing here yet.</p>
        ) : (
          cards.map((c) => <TokenCard key={c.contractAddress} data={c} />)
        )}
      </div>
    </div>
  );
}

export default async function Home() {
  const cards = await loadCards();

  const graduated = cards
    .filter((c) => c.graduationStatus === "GRADUATED")
    .sort((a, b) => b.launchedAt.getTime() - a.launchedAt.getTime());

  const finalStretch = cards
    .filter((c) => c.graduationStatus === "BONDING" && (c.progress ?? 0) >= FINAL_STRETCH_THRESHOLD)
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));

  const newPairs = cards
    .filter((c) => c.graduationStatus === "BONDING" && (c.progress ?? 0) < FINAL_STRETCH_THRESHOLD)
    .sort((a, b) => b.launchedAt.getTime() - a.launchedAt.getTime());

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="px-6 py-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Robinhood Chain Launchpad Tracker
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Live token launches across Robinhood Chain&apos;s bonding-curve launchpads.
            Currently tracking <span className="text-zinc-300 font-medium">Pons</span> — hood.fun and Pools.trade coming next.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Column title="New Pairs" subtitle="early bonding" cards={newPairs} />
          <Column title="Final Stretch" subtitle={`≥${FINAL_STRETCH_THRESHOLD}% to graduation`} cards={finalStretch} />
          <Column title="Migrated" subtitle="graduated" cards={graduated} />
        </div>
      </main>
    </div>
  );
}
