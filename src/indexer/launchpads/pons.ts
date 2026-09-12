import { parseAbiItem } from "viem";
import { publicClient, getLogsChunked } from "../chain";
import { prisma } from "../../lib/prisma";

// Verified live on HoodScan as `PonsV2LaunchFactory`, with real `launchToken`
// calls happening multiple times a minute. Confirmed against the actual
// Solidity source in ponsdotdev/ponsfamily, not just scraped docs — an
// earlier candidate address from docs.ponsfamily.com turned out to be a
// plain wallet, not a contract at all.
export const PONS_FACTORY_ADDRESS = "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e";

// Every event below is copied verbatim from the real source files
// (PonsV2LaunchFactory.sol and PonsV2BondingCurve.sol), not guessed.
const tokenLaunchedEvent = parseAbiItem(
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)"
);
const poolGraduatedEvent = parseAbiItem(
  "event PoolGraduated(address indexed token, uint256 positionId, uint256 tokenAmount, uint256 pairTokenAmount)"
);
const curveBuyEvent = parseAbiItem(
  "event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)"
);
const curveSellEvent = parseAbiItem(
  "event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)"
);

// Pons's launch event doesn't carry the token's name/symbol/logo — those
// live on the token's own ERC-20 contract ("self-describing onchain", per
// Pons's docs), so we read them directly once per launch. Confirmed
// logo() returns a real CDN URL by testing against a live token before
// relying on it.
const erc20MetadataAbi = [
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "logo", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

// Shared per-tick so multiple logs landing in the same block (very common
// when a chunk has several launches/trades) share one getBlock call
// instead of one each — cuts real RPC load, which matters now that we
// know Alchemy's free tier will 429 us.
async function blockTimestamp(blockNumber: bigint, cache: Map<string, Date>): Promise<Date> {
  const key = blockNumber.toString();
  const cached = cache.get(key);
  if (cached) return cached;
  const block = await publicClient.getBlock({ blockNumber });
  const date = new Date(Number(block.timestamp) * 1000);
  cache.set(key, date);
  return date;
}

async function readTokenMetadata(
  tokenAddress: `0x${string}`
): Promise<{ name: string; symbol: string; imageUrl: string | null }> {
  const [name, symbol] = await Promise.all([
    publicClient
      .readContract({ address: tokenAddress, abi: erc20MetadataAbi, functionName: "name" })
      .catch(() => "Unknown"),
    publicClient
      .readContract({ address: tokenAddress, abi: erc20MetadataAbi, functionName: "symbol" })
      .catch(() => "???"),
  ]);
  // logo() isn't part of the standard ERC-20 interface, so it's kept as
  // its own try/catch — a token missing it shouldn't lose its real name
  // and symbol too.
  const imageUrl = await publicClient
    .readContract({ address: tokenAddress, abi: erc20MetadataAbi, functionName: "logo" })
    .catch(() => null);
  return { name, symbol, imageUrl: imageUrl || null };
}

async function upsertLaunchedToken(
  log: {
    args: {
      token?: `0x${string}`;
      curve?: `0x${string}`;
      deployer?: `0x${string}`;
      pairToken?: `0x${string}`;
      graduationThreshold?: bigint;
    };
    transactionHash: `0x${string}`;
    blockNumber: bigint;
  },
  blockCache: Map<string, Date>
) {
  const { token, curve, deployer, pairToken, graduationThreshold } = log.args;
  if (!token || !curve || !deployer || !pairToken || graduationThreshold === undefined) return;

  const [{ name, symbol, imageUrl }, launchedAt] = await Promise.all([
    readTokenMetadata(token),
    blockTimestamp(log.blockNumber, blockCache),
  ]);

  await prisma.token.upsert({
    where: { contractAddress: token.toLowerCase() },
    create: {
      launchpad: "PONS",
      contractAddress: token.toLowerCase(),
      curveAddress: curve.toLowerCase(),
      name,
      symbol,
      imageUrl,
      creatorAddress: deployer.toLowerCase(),
      launchTxHash: log.transactionHash,
      launchedAt,
      quoteAsset: pairToken.toLowerCase(),
      graduationThreshold: graduationThreshold.toString(),
    },
    update: {}, // a launch only ever happens once per token; nothing to update if we see it again
  });

  console.log(`[pons] launched ${symbol} (${name}) at ${token}`);
}

async function markGraduated(
  log: { args: { token?: `0x${string}` }; blockNumber: bigint },
  blockCache: Map<string, Date>
) {
  const { token } = log.args;
  if (!token) return;
  const graduatedAt = await blockTimestamp(log.blockNumber, blockCache);
  await prisma.token.updateMany({
    where: { contractAddress: token.toLowerCase() },
    data: { graduationStatus: "GRADUATED", graduatedAt },
  });
  console.log(`[pons] graduated ${token}`);
}

async function recordTrade(
  log: {
    args: {
      buyer?: `0x${string}`;
      seller?: `0x${string}`;
      quoteIn?: bigint;
      quoteOut?: bigint;
      tokensOut?: bigint;
      tokensIn?: bigint;
    };
    address: `0x${string}`;
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    side: "BUY" | "SELL";
  },
  blockCache: Map<string, Date>
) {
  // The curve address on the log tells us which token this trade belongs
  // to — we look it up rather than watching each curve individually, since
  // that would mean juggling a separate subscription per token.
  const token = await prisma.token.findUnique({ where: { curveAddress: log.address.toLowerCase() } });
  if (!token) return; // a curve we haven't indexed a launch for yet

  const trader = log.side === "BUY" ? log.args.buyer : log.args.seller;
  const amountQuote = log.side === "BUY" ? log.args.quoteIn : log.args.quoteOut;
  const amountToken = log.side === "BUY" ? log.args.tokensOut : log.args.tokensIn;
  if (!trader || amountQuote === undefined || amountToken === undefined) return;

  const blockTime = await blockTimestamp(log.blockNumber, blockCache);
  await prisma.trade.create({
    data: {
      tokenId: token.id,
      txHash: log.transactionHash,
      traderAddress: trader.toLowerCase(),
      side: log.side,
      amountToken: amountToken.toString(),
      amountQuote: amountQuote.toString(),
      blockTime,
    },
  });
}

// How far back to look on first startup. At ~100ms per block this is a
// modest amount of recent history — enough to see the tracker populate
// with real, current activity without a long initial catch-up. Alchemy's
// free tier caps every log request to a 10-block range on this chain, so
// this is also intentionally small enough to catch up in a reasonable
// number of requests.
const BACKFILL_BLOCKS = BigInt(1_000);

async function processRange(fromBlock: bigint, toBlock: bigint) {
  const [launches, graduations, buys, sells] = await Promise.all([
    getLogsChunked({ address: PONS_FACTORY_ADDRESS, event: tokenLaunchedEvent, fromBlock, toBlock }),
    getLogsChunked({ address: PONS_FACTORY_ADDRESS, event: poolGraduatedEvent, fromBlock, toBlock }),
    getLogsChunked({ event: curveBuyEvent, fromBlock, toBlock }),
    getLogsChunked({ event: curveSellEvent, fromBlock, toBlock }),
  ]);

  // Shared across every log in this tick — several logs landing in the
  // same block (common) now cost one getBlock call instead of one each.
  const blockCache = new Map<string, Date>();

  // Launches first — trades and graduations for a token only make sense
  // once that token's row (and its curve address) already exists.
  for (const log of launches) await upsertLaunchedToken(log as any, blockCache);
  for (const log of graduations) await markGraduated(log as any, blockCache);
  for (const log of buys) await recordTrade({ ...(log as any), side: "BUY" }, blockCache);
  for (const log of sells) await recordTrade({ ...(log as any), side: "SELL" }, blockCache);

  if (launches.length || graduations.length || buys.length || sells.length) {
    console.log(
      `[pons] blocks ${fromBlock}-${toBlock}: ${launches.length} launches, ${graduations.length} graduations, ${buys.length} buys, ${sells.length} sells`
    );
  }
}

function isRateLimitError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 429 || String(err).includes("429");
}

// One continuous loop rather than a separate one-off backfill plus a
// watcher: it starts a bit behind the chain tip and works forward in
// 10-block chunks (the free-tier limit) until it's caught up, then just
// keeps checking for new blocks — so "catching up on history" and
// "watching for new activity" are the same code path, not two.
//
// Every step is inside the try/catch — this is a deliberate fix for a
// real outage: Alchemy 429'd us once, the uncaught error propagated all
// the way up to the process-level handler in run.ts, which called
// process.exit(1), and Railway does not automatically restart a crashed
// deployment. The indexer sat dead for over 10 hours before anyone
// noticed. A single bad tick (rate limit, timeout, brief RPC outage) must
// never take the whole process down again — it logs, backs off, and
// keeps going instead.
export async function runPonsIndexer() {
  let cursor: bigint | null = null;

  while (true) {
    try {
      let current: bigint;
      if (cursor === null) {
        const latest = await publicClient.getBlockNumber();
        current = latest > BACKFILL_BLOCKS ? latest - BACKFILL_BLOCKS : BigInt(0);
        console.log(`[pons] starting from block ${current}, chain tip is ${latest}`);
      } else {
        current = cursor;
      }

      const tip = await publicClient.getBlockNumber();
      if (current > tip) {
        cursor = current;
        await new Promise((r) => setTimeout(r, 2_000));
        continue;
      }
      const chunkEnd = current + BigInt(9) > tip ? tip : current + BigInt(9);
      await processRange(current, chunkEnd);
      cursor = chunkEnd + BigInt(1);
    } catch (err) {
      const backoffMs = isRateLimitError(err) ? 30_000 : 5_000;
      console.error(`[pons] tick failed, backing off ${backoffMs}ms:`, err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
}
