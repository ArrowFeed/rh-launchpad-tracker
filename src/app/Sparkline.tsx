"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

// A small inline trend chart for a card, not meant to be read precisely —
// just "is this going up or down" at a glance, the way Axiom and similar
// trading terminals show a mini price trend next to each token row.
export default function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div className="h-8 w-full" />;
  }
  const data = points.map((p, i) => ({ i, p }));
  const trendingUp = points[points.length - 1] >= points[0];

  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Line
            type="monotone"
            dataKey="p"
            stroke={trendingUp ? "#4ade80" : "#f87171"}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
