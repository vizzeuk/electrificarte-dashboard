import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { NewsletterTable } from "@/components/admin/newsletter-table";
import { getNewsletter } from "@/lib/data/admin-data";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DIA = 86_400_000;

export default async function NewsletterPage() {
  const rows = await getNewsletter();
  const now = Date.now();
  const unicos = new Set(rows.map((r) => (r.email ?? "").trim().toLowerCase()).filter(Boolean)).size;
  const ultimos = (d: number) => rows.filter((r) => r.created_at && now - new Date(r.created_at).getTime() <= d * DIA).length;

  return (
    <>
      <PageHeader title="Newsletter" subtitle="Correos suscritos al newsletter desde el sitio." />
      <Kpis cols={3}>
        <Kpi value={formatNumero(unicos)} label="Correos suscritos" hint={rows.length !== unicos ? `${formatNumero(rows.length)} suscripciones en total` : undefined} />
        <Kpi value={formatNumero(ultimos(7))} label="Nuevos en 7 días" />
        <Kpi value={formatNumero(ultimos(30))} label="Nuevos en 30 días" />
      </Kpis>
      <NewsletterTable rows={rows} now={now} />
    </>
  );
}
