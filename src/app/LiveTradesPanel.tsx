"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TokenAvatar from "./TokenAvatar";
import RelativeTime from "./RelativeTime";
import { fmtUsd } from "@/lib/format";

type TradeRow = {
  id: string;
  side: "BUY" | "SELL";
  traderAddress: string;
  blockTime: string;
  usdAmount: number | null;
  tokenSymbol: string;
  tokenImageUrl: string | null;
  tokenContractAddress: string;
  launchpad: string;
};

function shortAddr(a: string) {
  return `${a.slice(0, 5)}…${a.slice(-4)}`;
}

const POLL_MS = 5_000;

export default function LiveTradesPanel() {
  const [open, setOpen] = useState(false);
  const [trades, setTrades] = useState<TradeRow[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/recent-trades");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setTrades(data.trades);
      } catch {}
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open]);

  return (
    <>
      {/* Always-visible tab on the left edge — clicking it toggles the
          panel rather than the panel always taking up screen space,
          since most of the time you're looking at the New Pairs/Final
          Stretch/Migrated columns, not a trade firehose. */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-zinc-900 border border-zinc-800 border-l-0 rounded-r-lg px-1.5 py-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="text-[11px] tracking-wide flex items-center gap-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${open ? "bg-green-400" : "bg-zinc-600"}`} />
          Live Trades
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-zinc-950 border-r border-zinc-800 z-40 flex flex-col">
            <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-200">Live Trades</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {trades.length === 0 ? (
                <p className="text-zinc-600 text-xs p-3">No trades yet.</p>
              ) : (
                trades.map((t) => (
                  <Link
                    key={t.id}
                    href={`/token/${t.tokenContractAddress}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 border-b border-zinc-900 hover:bg-zinc-900 transition-colors"
                  >
                    <TokenAvatar imageUrl={t.tokenImageUrl} symbol={t.tokenSymbol} size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`font-medium ${t.side === "BUY" ? "text-green-400" : "text-red-400"}`}
                        >
                          {t.side}
                        </span>
                        <span className="text-zinc-200 truncate">{t.tokenSymbol}</span>
                      </div>
                      <div className="text-[10px] text-zinc-600 font-mono truncate">
                        {shortAddr(t.traderAddress)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-zinc-300">{fmtUsd(t.usdAmount)}</div>
                      <div className="text-[10px] text-zinc-600">
                        <RelativeTime date={new Date(t.blockTime)} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
