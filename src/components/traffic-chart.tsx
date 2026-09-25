"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TrafficPoint } from "@/lib/mock/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function TrafficChart({
  data,
  title = "Tráfico del sitio",
  description = "Visitas de los últimos 14 días",
  seriesLabel = "Visitas",
  className,
}: {
  data: TrafficPoint[];
  title?: string;
  description?: string;
  seriesLabel?: string;
  className?: string;
}) {
  const chartConfig = {
    visitas: {
      label: seriesLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="fecha"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value: string) => (ISO_DATE.test(value) ? value.slice(5) : value)}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="visitas"
              stroke="var(--color-visitas)"
              fill="var(--muted)"
              fillOpacity={1}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
