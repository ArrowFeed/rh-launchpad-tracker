import { runPonsIndexer } from "./launchpads/pons";

// This is the standalone process that runs continuously (on Railway, per
// the plan) reading Robinhood Chain and writing into Postgres. It's
// intentionally separate from the Next.js app, which only ever reads from
// the database — the web app never touches the chain directly.

// A real outage happened once already: Alchemy rate-limited a request,
// the resulting error propagated uncaught all the way up here, and
// process.exit(1) took the whole service down. Railway does not restart
// a crashed deployment on its own, so it just stayed dead — silently —
// until someone happened to notice the data had gone stale. Every
// launchpad's own loop (see runPonsIndexer) now catches its own errors
// and keeps going, but these two handlers are the last line of defense
// against anything unexpected slipping through some other path: log it,
// stay alive, never exit on our own.
process.on("uncaughtException", (err) => {
  console.error("[fatal-guard] uncaughtException (indexer stays alive):", err);
});
process.on("unhandledRejection", (err) => {
  console.error("[fatal-guard] unhandledRejection (indexer stays alive):", err);
});

async function main() {
  console.log("Indexer starting...");
  await runPonsIndexer(); // never resolves, and never throws — loops and self-heals forever
}

main().catch((err) => {
  // In practice this should be unreachable, since runPonsIndexer handles
  // its own errors internally — but if it's ever reached, log loudly
  // rather than exiting, so this can't be the thing that goes quiet
  // again.
  console.error("[fatal-guard] main() rejected unexpectedly:", err);
});
