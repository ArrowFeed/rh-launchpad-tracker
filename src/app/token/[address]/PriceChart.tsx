"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fmtUsd } from "@/lib/format";

export type PricePoint = { time: string; price: number };

export default function PriceChart({ data }: { data: PricePoint[] }) {
  if (data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-sm border border-zinc-800 rounded-xl">
        Not enough trades yet for a price chart.
      </div>
    );
  }

  return (
    <div className="h-64 border border-zinc-800 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#27272a" }} />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
            width={70}
            tickFormatter={(v) => fmtUsd(Number(v))}
          />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value) => [typeof value === "number" ? fmtUsd(value) : String(value), "Price"]}
          />
          <Line type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
