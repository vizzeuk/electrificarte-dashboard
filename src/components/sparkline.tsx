"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

/** Mini línea de tendencia sin ejes, para usar dentro de KpiCard. Aparte para que KpiCard pueda
 * seguir siendo un Server Component (recibe `icon` como referencia de componente — una función —
 * que no es serializable si KpiCard fuera "use client"). */
export function Sparkline({ data }: { data: number[] }) {
  return (
    <div className="h-8 w-full pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v) => ({ v }))}>
          <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
