"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { Tramo } from "@/lib/series";
import { cn } from "@/lib/utils";

export interface SerieDef {
  key: string;
  label: string;
  data: (number | null)[];
  /** var(--chart-1) … var(--chart-5). Siempre en orden fijo: la misma métrica, el mismo color. */
  color: string;
}

const NUM = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const NOTA = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Fila = { label: string; largo: string } & Record<string, number | null | string>;

/**
 * Serie de tiempo del panel. Conteos en barras (base en cero, puntas de 4 px), notas y
 * acumulados en línea/área. Un solo eje siempre: dos medidas de distinta escala van en dos
 * gráficos. Leyenda arriba cuando hay 2+ series; tabla oculta para lectores de pantalla.
 */
export function SerieChart({
  tramos,
  series,
  tipo = "barras",
  formato = "numero",
  altura = 220,
  vacio = "Sin registros en este período.",
  className,
}: {
  tramos: Tramo[];
  series: SerieDef[];
  tipo?: "barras" | "linea" | "area";
  formato?: "numero" | "nota";
  altura?: number;
  vacio?: string;
  className?: string;
}) {
  const fmt = (v: number) => (formato === "nota" ? NOTA.format(v) : NUM.format(v));
  const filas: Fila[] = tramos.map((t, i) => {
    const f: Fila = { label: t.label, largo: t.largo };
    for (const s of series) f[s.key] = s.data[i] ?? null;
    return f;
  });
  const config = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig;
  const hayDatos = series.some((s) => s.data.some((v) => v != null && v !== 0)) || (tipo === "area" && series.some((s) => s.data.some((v) => v != null)));
  // En notas, pocos puntos sueltos: se marcan para que no parezca una línea continua de datos.
  const puntosSueltos = formato === "nota" && series.some((s) => s.data.filter((v) => v != null).length < tramos.length);

  const ejes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey="label"
        axisLine={false}
        tickLine={false}
        tickMargin={8}
        minTickGap={20}
        interval="preserveStartEnd"
        tick={{ fontSize: 12 }}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        width={formato === "nota" ? 32 : 36}
        tick={{ fontSize: 12 }}
        allowDecimals={formato === "nota"}
        domain={formato === "nota" ? [1, 5] : [0, "auto"]}
        ticks={formato === "nota" ? [1, 2, 3, 4, 5] : undefined}
        tickFormatter={(v: number) => fmt(v)}
      />
      <ChartTooltip
        cursor={tipo === "barras" ? { fill: "var(--muted)" } : { stroke: "var(--border)" }}
        content={<Tooltip series={series} fmt={fmt} />}
      />
    </>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-micro" aria-hidden>
          {series.map((s) => (
            <li key={s.key} className="text-muted-foreground flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {!hayDatos ? (
        <div className="bg-muted text-muted-foreground flex items-center justify-center rounded-control text-small" style={{ height: altura }}>
          {vacio}
        </div>
      ) : (
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height: altura }}>
          {tipo === "barras" ? (
            <BarChart data={filas} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
              {ejes}
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              ))}
            </BarChart>
          ) : tipo === "area" ? (
            <AreaChart data={filas} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              {ejes}
              {series.map((s) => (
                <Area key={s.key} type="linear" dataKey={s.key} stroke={`var(--color-${s.key})`} strokeWidth={2} fill="var(--muted)" fillOpacity={1} isAnimationActive={false} />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              {ejes}
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={`var(--color-${s.key})`}
                  strokeWidth={2}
                  connectNulls
                  dot={puntosSueltos ? { r: 4, strokeWidth: 2, fill: "var(--background)" } : false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "var(--background)" }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          )}
        </ChartContainer>
      )}
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            {series.map((s) => (
              <th key={s.key} scope="col">{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.largo}>
              <th scope="row">{f.largo}</th>
              {series.map((s) => (
                <td key={s.key}>{f[s.key] == null ? "Sin datos" : fmt(f[s.key] as number)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tooltip({
  active,
  payload,
  series,
  fmt,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  series: SerieDef[];
  fmt: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fila = payload[0].payload as Fila;
  return (
    <div className="bg-popover text-popover-foreground grid min-w-40 gap-1.5 rounded-control border px-3 py-2 text-micro shadow-overlay">
      <p className="font-semibold">{fila.largo}</p>
      {series.map((s) => {
        const v = fila[s.key] as number | null;
        return (
          <p key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: s.color }} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums">{v == null ? "Sin datos" : fmt(v)}</span>
          </p>
        );
      })}
    </div>
  );
}
