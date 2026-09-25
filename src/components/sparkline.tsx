"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

/** Mini línea de tendencia sin ejes, para KpiCard. Aparte para que KpiCard siga siendo
 * Server Component. Color: --chart-1 (Laguna en claro, Glaciar en oscuro). */
export function Sparkline({ data }: { data: number[] }) {
  return (
    <div className="h-8 w-full pt-1" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v) => ({ v }))}>
          <Line type="monotone" dataKey="v" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
