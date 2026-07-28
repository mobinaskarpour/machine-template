"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { runtime, mockData } from "@/lib/runtime";

export function DashboardCharts({ dashboardId }: { dashboardId: string }) {
  const dash = runtime.dashboards.find((d) => d.id === dashboardId);
  if (!dash) return null;
  const series = (mockData as { chartSeries?: Array<{ name: string; value: number }> }).chartSeries ?? [
    { name: "W1", value: 40 },
    { name: "W2", value: 55 },
    { name: "W3", value: 48 },
    { name: "W4", value: 62 },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium">Operational trend</p>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1b4d3e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium">Category comparison</p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1b4d3e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
