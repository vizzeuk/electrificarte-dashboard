"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface DonutItem {
  label: string;
  value: number;
  [key: string]: string | number;
}

/** Donut chart con leyenda lateral — para breakdowns de composición (canal de tráfico,
 * dispositivo). Mismos chart-1..5 del tema ya usados en traffic-chart.tsx. */
export function DonutBreakdown({
  title,
  description,
  items,
  valueSuffix = "%",
}: {
  title: string;
  description?: string;
  items: DonutItem[];
  valueSuffix?: string;
}) {
  const chartConfig = items.reduce((cfg, item, i) => {
    cfg[item.label] = { label: item.label, color: COLORS[i % COLORS.length] };
    return cfg;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="@container flex flex-col items-center gap-6 @sm:flex-row">
        <ChartContainer config={chartConfig} className="aspect-square h-[160px] w-[160px] shrink-0">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={items} dataKey="value" nameKey="label" innerRadius={44} outerRadius={72} strokeWidth={2}>
              {items.map((item, i) => (
                <Cell key={item.label} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="w-full min-w-0 flex-1 space-y-2.5">
          {items.map((item, i) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  aria-hidden
                />
                <span className="truncate font-medium">{item.label}</span>
              </span>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {item.value}
                {valueSuffix}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
