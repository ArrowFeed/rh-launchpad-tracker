import { prisma } from "@/lib/prisma";

// Without this, Next.js would run the database query once at build time
// and bake that snapshot into a static page — the table would never
// update as the indexer adds new tokens. This forces a fresh query on
// every page load instead.
export const dynamic = "force-dynamic";

function shortAddr(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// A plain, unsorted list for now — this exists to prove real launches are
// actually reaching the database and can be displayed, nothing more.
// Sorting, filtering, market cap, and the other launchpads all come later.
export default async function Home() {
  const tokens = await prisma.token.findMany({
    orderBy: { launchedAt: "desc" },
    include: { _count: { select: { trades: true } } },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Robinhood Chain Launchpad Tracker
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {tokens.length} token{tokens.length === 1 ? "" : "s"} indexed so far, Pons only for now.
          </p>
        </div>

        {tokens.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No tokens indexed yet — the indexer needs to be running for data to show up here.
          </p>
        ) : (
          <div className="overflow-x-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="px-4 py-2 font-medium">Token</th>
                  <th className="px-4 py-2 font-medium">Launchpad</th>
                  <th className="px-4 py-2 font-medium">Creator</th>
                  <th className="px-4 py-2 font-medium">Trades</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Launched</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-900 last:border-0">
                    <td className="px-4 py-2">
                      <span className="font-medium">{t.symbol}</span>{" "}
                      <span className="text-zinc-500">{t.name}</span>
                    </td>
                    <td className="px-4 py-2 text-zinc-400">{t.launchpad}</td>
                    <td className="px-4 py-2 text-zinc-400 font-mono text-xs">
                      {shortAddr(t.creatorAddress)}
                    </td>
                    <td className="px-4 py-2">{t._count.trades}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          t.graduationStatus === "GRADUATED"
                            ? "text-green-400"
                            : "text-amber-400"
                        }
                      >
                        {t.graduationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">
                      {t.launchedAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
