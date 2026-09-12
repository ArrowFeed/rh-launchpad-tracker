import { runPonsIndexer } from "./launchpads/pons";

// This is the standalone process that runs continuously (on Railway, per
// the plan) reading Robinhood Chain and writing into Postgres. It's
// intentionally separate from the Next.js app, which only ever reads from
// the database — the web app never touches the chain directly.
async function main() {
  console.log("Indexer starting...");
  await runPonsIndexer(); // never resolves — loops forever
}

main().catch((err) => {
  console.error("Indexer crashed:", err);
  process.exit(1);
});
