import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TopListItem {
  label: string;
  sublabel?: string;
  value: number;
}

export function TopList({
  title,
  description,
  items,
  valueLabel = "visitas",
}: {
  title: string;
  description?: string;
  items: TopListItem[];
  valueLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, i) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                <span className="text-muted-foreground mr-2 tabular-nums">{i + 1}.</span>
                {item.label}
                {item.sublabel && <span className="text-muted-foreground font-normal ml-1.5">— {item.sublabel}</span>}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {item.value.toLocaleString("es-CL")} {valueLabel}
              </span>
            </div>
            <Progress value={(item.value / max) * 100} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
