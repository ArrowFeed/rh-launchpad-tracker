import { publicClient } from "@/indexer/chain";
import { NATIVE_ETH_ADDRESS } from "@/lib/ethPrice";

// Pons V2 always mints a fixed 1,000,000,000-token supply per launch —
// documented behavior, not something we need to read from chain per token.
export const PONS_TOTAL_SUPPLY = 1_000_000_000;

const curveReservesAbi = [
  {
    name: "getReserves",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "quoteReserve_", type: "uint256" },
      { name: "tokenReserve_", type: "uint256" },
    ],
  },
] as const;

type TradeLike = { amountToken: string; amountQuote: string; blockTime: Date };

// Price is derived from the most recent trade rather than stored directly
// — amountToken/amountQuote are raw on-chain units (18 decimals on both
// sides for Pons), so dividing them gives quote-per-token directly.
export function latestPrice(trades: TradeLike[]): number | null {
  if (!trades.length) return null;
  const last = trades[trades.length - 1];
  const tokenAmount = Number(last.amountToken) / 1e18;
  const quoteAmount = Number(last.amountQuote) / 1e18;
  if (tokenAmount === 0) return null;
  return quoteAmount / tokenAmount;
}

export function marketCap(price: number | null): number | null {
  if (price === null) return null;
  return price * PONS_TOTAL_SUPPLY;
}

export function volumeSince(trades: TradeLike[], sinceMs: number): number {
  const cutoff = Date.now() - sinceMs;
  return trades
    .filter((t) => t.blockTime.getTime() >= cutoff)
    .reduce((sum, t) => sum + Number(t.amountQuote) / 1e18, 0);
}

// Only native ETH (the zero address, how these contracts represent it) has
// a live price source wired up right now — most launches use it, but a
// handful use other quote assets (stablecoins, tokenized stocks) we don't
// have a price feed for yet. Returning null for those is more honest than
// guessing, and callers should show "—" rather than a made-up number.
export function toUsd(
  quoteAmount: number | null,
  quoteAsset: string,
  ethUsdPrice: number | null
): number | null {
  if (quoteAmount === null || ethUsdPrice === null) return null;
  if (quoteAsset.toLowerCase() !== NATIVE_ETH_ADDRESS) return null;
  return quoteAmount * ethUsdPrice;
}

// Live on-chain read rather than derived from trade history — this is the
// one number where "current on-chain truth" matters more than "what our
// own indexer has captured so far," since a missed trade would otherwise
// throw the progress calculation off.
export async function graduationProgressPct(
  curveAddress: string,
  graduationThreshold: string | null
): Promise<number | null> {
  if (!graduationThreshold) return null;
  try {
    const [quoteReserve] = await publicClient.readContract({
      address: curveAddress as `0x${string}`,
      abi: curveReservesAbi,
      functionName: "getReserves",
    });
    const threshold = BigInt(graduationThreshold);
    if (threshold === BigInt(0)) return null;
    const pct = (Number(quoteReserve) / Number(threshold)) * 100;
    return Math.min(100, Math.max(0, pct));
  } catch {
    return null; // curve may already be swept/gone post-graduation
  }
}
