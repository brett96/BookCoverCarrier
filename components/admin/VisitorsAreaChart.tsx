"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type VisitorsPoint = { date: string; visitors: number };

export function VisitorsAreaChart({
  data,
  fill = "#94a3b8",
}: {
  data: VisitorsPoint[];
  fill?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="visitors"
          stroke="#0f172a"
          fill={fill}
          fillOpacity={0.35}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
