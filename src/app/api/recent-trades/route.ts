import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEthUsdPrice } from "@/lib/ethPrice";
import { toUsd } from "@/lib/ponsMarket";

// Powers the live trade feed panel — every trade across every indexed
// token, newest first, regardless of launchpad. The panel polls this on
// an interval rather than us pushing updates, which is the simplest
// thing that works for how infrequent trades actually are right now;
// worth revisiting with a websocket/SSE push if trade volume ever makes
// polling feel laggy.
export async function GET() {
  const [trades, ethUsdPrice] = await Promise.all([
    prisma.trade.findMany({
      orderBy: { blockTime: "desc" },
      take: 50,
      include: { token: { select: { symbol: true, imageUrl: true, contractAddress: true, quoteAsset: true, launchpad: true } } },
    }),
    getEthUsdPrice(),
  ]);

  const rows = trades.map((t) => {
    const quoteAmount = Number(t.amountQuote) / 1e18;
    return {
      id: t.id,
      side: t.side,
      traderAddress: t.traderAddress,
      blockTime: t.blockTime.toISOString(),
      usdAmount: toUsd(quoteAmount, t.token.quoteAsset, ethUsdPrice),
      tokenSymbol: t.token.symbol,
      tokenImageUrl: t.token.imageUrl,
      tokenContractAddress: t.token.contractAddress,
      launchpad: t.token.launchpad,
    };
  });

  return NextResponse.json({ trades: rows });
}
