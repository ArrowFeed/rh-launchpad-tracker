import { createPublicClient, defineChain, http, type AbiEvent, type Log } from "viem";

// Robinhood Chain isn't in viem's built-in list of chains yet, so we
// describe it ourselves. Confirmed live: chain ID 4663, ETH gas.
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.ROBINHOOD_RPC_URL!] },
  },
  blockExplorers: {
    default: { name: "HoodScan", url: "https://hoodscan.pro" },
  },
});

if (!process.env.ROBINHOOD_RPC_URL) {
  throw new Error("Missing ROBINHOOD_RPC_URL in .env");
}

// A read-only client — this indexer never sends transactions or holds a
// private key, it only reads blocks, logs, and contract state.
export const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(process.env.ROBINHOOD_RPC_URL),
});

// Alchemy's free tier only allows a 10-block range per eth_getLogs call on
// this chain (its ~100ms blocks make a "normal" range far too wide for
// their free tier). This fetches a wider range by looping in chunks small
// enough to stay under that limit, so the rest of the codebase can just
// ask for whatever range it actually wants.
const MAX_LOG_RANGE = BigInt(10);

export async function getLogsChunked(params: {
  address?: `0x${string}`;
  event: AbiEvent;
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<Log[]> {
  const { address, event, fromBlock, toBlock } = params;
  const allLogs: Log[] = [];
  let start = fromBlock;
  while (start <= toBlock) {
    const end = start + MAX_LOG_RANGE - BigInt(1) > toBlock ? toBlock : start + MAX_LOG_RANGE - BigInt(1);
    const logs = await publicClient.getLogs({ address, event, fromBlock: start, toBlock: end });
    allLogs.push(...logs);
    start = end + BigInt(1);
  }
  return allLogs;
}
