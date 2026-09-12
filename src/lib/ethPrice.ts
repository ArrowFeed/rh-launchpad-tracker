// A live ETH/USD rate, used to convert quote-asset amounts into real
// dollar figures wherever the quote asset is native ETH (the zero
// address, per how these contracts represent it) — which is most of
// what's been launched so far. CoinGecko's free endpoint needs no API
// key; cached briefly so we're not hitting it on every single request.
let cached: { price: number; fetchedAt: number } | null = null;
const CACHE_MS = 5 * 60_000;

export async function getEthUsdPrice(): Promise<number | null> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached.price;
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return cached?.price ?? null;
    const data = await res.json();
    const price = data?.ethereum?.usd;
    if (typeof price !== "number") return cached?.price ?? null;
    cached = { price, fetchedAt: Date.now() };
    return price;
  } catch {
    return cached?.price ?? null; // stale-but-usable beats nothing if CoinGecko hiccups
  }
}

export const NATIVE_ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
