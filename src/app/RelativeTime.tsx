"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/format";

// Renders nothing on the very first render (identical on server and
// client), then fills in the real "Xm ago" text once mounted — computing
// it during the initial render caused a hydration mismatch, since the
// server-rendered value and the client's first-render value can disagree
// whenever a minute boundary passes between the two (which, across 70+
// cards on a page, happens essentially every load). Also keeps it
// ticking forward every 30s instead of freezing at whatever it said on
// load.
export default function RelativeTime({ date }: { date: Date }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(relativeTime(date));
    const id = setInterval(() => setText(relativeTime(date)), 30_000);
    return () => clearInterval(id);
  }, [date]);

  return <>{text ?? ""}</>;
}
