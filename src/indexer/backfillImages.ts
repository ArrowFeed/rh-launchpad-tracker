// One-off script: fills in imageUrl for tokens indexed before logo()
// reading was added. Not part of the regular indexer loop — run once
// with `npx tsx --env-file=.env src/indexer/backfillImages.ts`.
import { publicClient } from "./chain";
import { prisma } from "../lib/prisma";

const logoAbi = [
  { name: "logo", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

async function main() {
  const tokens = await prisma.token.findMany({ where: { imageUrl: null } });
  console.log(`Backfilling images for ${tokens.length} tokens...`);
  for (const t of tokens) {
    const imageUrl = await publicClient
      .readContract({ address: t.contractAddress as `0x${string}`, abi: logoAbi, functionName: "logo" })
      .catch(() => null);
    if (imageUrl) {
      await prisma.token.update({ where: { id: t.id }, data: { imageUrl } });
      console.log(`  ${t.symbol}: got image`);
    } else {
      console.log(`  ${t.symbol}: no logo available`);
    }
  }
  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
