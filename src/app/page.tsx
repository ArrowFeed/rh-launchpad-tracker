export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Robinhood Chain Launchpad Tracker
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The dashboard isn&apos;t built yet — this page just proves the app
          is deployed and running. Once the database is connected, check{" "}
          <code className="text-zinc-200">/api/health</code> to confirm the
          indexer&apos;s data is reachable.
        </p>
      </div>
    </div>
  );
}
