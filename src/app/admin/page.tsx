import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { getAdminOverview, type Actividad, type Conteo } from "@/lib/data/admin-data";
import { formatFechaHora, formatNumero, hace } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIPO: Record<Actividad["tipo"], string> = {
  waitlist: "Waitlist",
  asesoria: "Asesoría",
  vendedor: "Vendedor",
  oferta: "Oferta",
  resena: "Reseña",
  newsletter: "Newsletter",
  feedback: "Feedback",
};

interface Fila {
  nombre: string;
  href: string;
  conteo: Conteo;
  pendiente?: { valor: number; texto: string };
  nota?: string;
}

export default async function AdminOverviewPage() {
  const o = await getAdminOverview();
  if (!o) return null; // el layout ya gatea; sin sesión admin no hay datos

  const filas: Fila[] = [
    { nombre: "Waitlist", href: "/admin/waitlist", conteo: o.waitlist, pendiente: { valor: o.waitlist.sinContactar, texto: "sin contactar" } },
    { nombre: "Asesorías", href: "/admin/asesorias", conteo: o.asesorias, pendiente: { valor: o.asesorias.pendientes, texto: "con pago pendiente" } },
    { nombre: "Reseñas", href: "/admin/resenas", conteo: o.resenas, pendiente: { valor: o.resenas.porModerar, texto: "por moderar" } },
    { nombre: "Vendedores", href: "/admin/vendedores", conteo: o.vendedores, pendiente: { valor: o.vendedores.total - o.vendedores.activos, texto: "no activos" } },
    { nombre: "Newsletter", href: "/admin/newsletter", conteo: o.newsletter },
    { nombre: "Feedback del sitio", href: "/admin/feedback", conteo: o.feedback },
    { nombre: "Leads Oferta", href: "/admin/leads-oferta", conteo: o.leadsOferta, nota: "En pausa" },
  ];

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={`Lo que ha entrado a la base de datos. Actualizado el ${formatFechaHora(new Date(o.generadoEn).toISOString())} (hora de Chile).`}
      />

      {/* El bloque destacado (Glaciar, uno por pantalla): la waitlist es la métrica del giro. */}
      <section className="bg-accent-soft text-on-accent-soft rounded-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-small font-semibold">Personas en la waitlist</p>
            <p className="font-display mt-2 text-h1 font-extrabold tabular-nums">{formatNumero(o.waitlist.personas)}</p>
            <p className="mt-3 max-w-xl text-base">
              {o.waitlist.ultimos7 === 0
                ? "Nadie nuevo en los últimos 7 días."
                : `${formatNumero(o.waitlist.ultimos7)} ${o.waitlist.ultimos7 === 1 ? "inscripción nueva" : "inscripciones nuevas"} en los últimos 7 días, ${formatNumero(o.waitlist.ultimos30)} en 30 días.`}{" "}
              Es la base de demanda que se le ofrecerá a la red de vendedores oficiales.
            </p>
          </div>
          {/* El bloque es Glaciar en ambos temas, así que el botón usa los primitivos (Laguna). */}
          <Link
            href="/admin/waitlist"
            className="group bg-laguna text-papel hover:bg-laguna-hover inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-control px-5 text-[15px] font-semibold transition-colors focus-visible:outline-tinta sm:self-auto"
          >
            Ver la waitlist
            <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-[3px]" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-5">
        <section className="flex min-w-0 flex-col gap-4 xl:col-span-3">
          <SectionTitle title="Por sección" description="Registros totales y nuevos en cada tabla." />
          <div className="overflow-hidden rounded-card border">
            <table className="w-full text-small">
              <thead className="bg-muted text-muted-foreground">
                <tr className="border-b text-left text-label">
                  <th scope="col" className="px-4 py-3 font-semibold">Sección</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Total</th>
                  <th scope="col" className="hidden px-3 py-3 text-right font-semibold whitespace-nowrap sm:table-cell">7 días</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold whitespace-nowrap">30 días</th>
                  <th scope="col" className="w-8 px-3 py-3"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.href} className="hover:bg-muted group relative border-b transition-colors last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <Link href={f.href} className="font-semibold after:absolute after:inset-0 focus-visible:outline-offset-[-2px]">
                        {f.nombre}
                      </Link>
                      {f.nota && <Badge variant="secondary" className="ml-2 align-middle">{f.nota}</Badge>}
                      {f.pendiente && f.pendiente.valor > 0 && (
                        <span className="text-muted-foreground block text-micro">
                          {formatNumero(f.pendiente.valor)} {f.pendiente.texto}
                        </span>
                      )}
                    </th>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatNumero(f.conteo.total)}</td>
                    <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">{formatNumero(f.conteo.ultimos7)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumero(f.conteo.ultimos30)}</td>
                    <td className="text-muted-foreground px-3 py-3">
                      <ChevronRight className="size-4 transition-transform group-hover:translate-x-[3px]" strokeWidth={1.5} aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {o.feedback.promedio != null && (
            <p className="text-muted-foreground text-small">
              Nota promedio del sitio:{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {o.feedback.promedio.toLocaleString("es-CL", { maximumFractionDigits: 1 })} de 5
              </span>{" "}
              ({formatNumero(o.feedback.total)} {o.feedback.total === 1 ? "calificación" : "calificaciones"}).
            </p>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          <SectionTitle title="Actividad reciente" description="Lo último que entró, de cualquier sección." />
          {o.actividad.length === 0 ? (
            <div className="rounded-card border">
              <EmptyState title="Sin actividad todavía" description="Cuando entren registros nuevos aparecen acá." />
            </div>
          ) : (
            <ol className="divide-y rounded-card border">
              {o.actividad.map((a, i) => (
                <li key={`${a.tipo}-${a.fecha}-${i}`}>
                  <Link href={a.href} className="hover:bg-muted grid gap-1.5 px-4 py-3 transition-colors focus-visible:outline-offset-[-2px]">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-small font-semibold">{a.titulo}</span>
                      <span className="text-muted-foreground shrink-0 text-micro tabular-nums">{hace(a.fecha, o.generadoEn)}</span>
                    </span>
                    <span className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0">{TIPO[a.tipo]}</Badge>
                      {a.detalle && <span className="text-muted-foreground line-clamp-2 text-small">{a.detalle}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
