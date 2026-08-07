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
      color: "var(--primary)",
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
            <defs>
              <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visitas)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-visitas)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="fecha"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) => (ISO_DATE.test(value) ? value.slice(5) : value)}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="visitas"
              stroke="var(--color-visitas)"
              fill="url(#colorVisitas)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
