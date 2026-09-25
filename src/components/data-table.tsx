"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search, SearchX, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatNumero } from "@/lib/utils";

/**
 * Tabla genérica del panel admin. Todo corre en el cliente sobre filas ya leídas en el servidor
 * (volúmenes chicos): búsqueda, filtros, rango de fechas, orden, paginación y CSV.
 * En pantallas chicas cada fila se muestra como bloque apilado (sin scroll horizontal).
 *
 * Las columnas llevan funciones, así que cada sección define las suyas en un componente
 * "use client" propio y le pasa acá solo datos serializables.
 */
export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Si existe, la columna se puede ordenar con este valor. */
  sortValue?: (row: T) => string | number | null;
  /** Valor para el CSV. Si falta, la columna no se exporta. */
  csv?: (row: T) => string | number | null | undefined;
  /** Encabezado en el CSV si difiere del de pantalla (p. ej. "Contacto" → "Email"). */
  csvHeader?: string;
  className?: string;
  /** Oculta la columna en la vista de escritorio (sigue en el detalle y el CSV). */
  hideOnDesktop?: boolean;
  /** En móvil, la columna principal va arriba en negrita, sin etiqueta. */
  primary?: boolean;
  /** No mostrar en la vista móvil. */
  hideOnMobile?: boolean;
}

export interface FilterDef<T> {
  id: string;
  label: string;
  /** Texto de la opción "todos". */
  allLabel?: string;
  options: { value: string; label: string }[];
  /** Valor de la fila; pasa el filtro si es igual a la opción elegida. */
  get?: (row: T) => string;
  /** Alternativa a `get` para filtros que no son de igualdad (p. ej. "ofrece esta marca"). */
  match?: (row: T, value: string) => boolean;
}

type Rango = "todo" | "7" | "30" | "90";

const RANGOS: { value: Rango; label: string }[] = [
  { value: "todo", label: "Todas las fechas" },
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 90 días" },
];

const POR_PAGINA = 25;

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function aCsv<T>(rows: T[], cols: Column<T>[]): string {
  const exportables = cols.filter((c) => c.csv);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = exportables.map((c) => esc(c.csvHeader ?? c.header)).join(";");
  const body = rows.map((r) => exportables.map((c) => esc(c.csv!(r))).join(";"));
  // BOM para que Excel abra bien los acentos; ";" porque Excel en es-CL usa coma decimal.
  return "\uFEFF" + [head, ...body].join("\r\n");
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchText,
  searchPlaceholder = "Buscar",
  filters = [],
  dateOf,
  now,
  defaultSort,
  csvName,
  detail,
  detailTitle,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rowClassName,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string | number;
  /** Texto donde busca el buscador (nombre, email, teléfono…). */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: FilterDef<T>[];
  /** Fecha de la fila para el filtro de rango. */
  dateOf?: (row: T) => string | null;
  /** Momento de referencia (lo fija el servidor) para el filtro de rango. */
  now: number;
  defaultSort?: { id: string; desc: boolean };
  /** Nombre base del archivo CSV; sin él no se ofrece exportar. */
  csvName?: string;
  /** Contenido del panel de detalle al hacer clic en una fila. */
  detail?: (row: T) => React.ReactNode;
  detailTitle?: (row: T) => string;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyDescription?: React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
}) {
  const [q, setQ] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [rango, setRango] = useState<Rango>("todo");
  const [sort, setSort] = useState(defaultSort ?? null);
  const [pagina, setPagina] = useState(0);
  const [sel, setSel] = useState<T | null>(null);

  const filtradas = useMemo(() => {
    const nq = normalizar(q.trim());
    const desde = rango === "todo" ? null : now - Number(rango) * 86_400_000;
    let out = rows.filter((r) => {
      if (nq && searchText && !normalizar(searchText(r)).includes(nq)) return false;
      for (const f of filters) {
        const v = valores[f.id];
        if (!v || v === "__todos") continue;
        if (f.match ? !f.match(r, v) : f.get?.(r) !== v) return false;
      }
      if (desde != null && dateOf) {
        const d = dateOf(r);
        if (!d || new Date(d).getTime() < desde) return false;
      }
      return true;
    });
    const col = sort && columns.find((c) => c.id === sort.id);
    if (col?.sortValue) {
      const dir = sort!.desc ? -1 : 1;
      out = [...out].sort((a, b) => {
        const va = col.sortValue!(a);
        const vb = col.sortValue!(b);
        if (va == null && vb == null) return 0;
        if (va == null) return 1; // vacíos siempre al final
        if (vb == null) return -1;
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
        return String(va).localeCompare(String(vb), "es") * dir;
      });
    }
    return out;
  }, [rows, q, valores, rango, sort, columns, filters, searchText, dateOf, now]);

  const hayFiltros = q.trim() !== "" || rango !== "todo" || Object.values(valores).some((v) => v && v !== "__todos");
  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas - 1);
  const visibles = filtradas.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);
  const desktopCols = columns.filter((c) => !c.hideOnDesktop);
  const mobileCols = columns.filter((c) => !c.hideOnMobile && !c.primary);
  const primaryCol = columns.find((c) => c.primary);

  function limpiar() {
    setQ("");
    setValores({});
    setRango("todo");
    setPagina(0);
  }

  function ordenar(id: string) {
    setSort((s) => (s?.id === id ? { id, desc: !s.desc } : { id, desc: true }));
    setPagina(0);
  }

  function descargar() {
    const blob = new Blob([aCsv(filtradas, columns)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const hoy = new Date(now).toISOString().slice(0, 10);
    a.href = url;
    a.download = `${csvName}-${hoy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-card border">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra: búsqueda, conteo y CSV arriba; filtros debajo */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {searchText && (
            <label className="relative min-w-0 flex-1 sm:max-w-md">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2" strokeWidth={1.5} />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPagina(0);
                }}
                placeholder={searchPlaceholder}
                className="h-10 pl-10 text-small md:text-small"
              />
            </label>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <p className="text-muted-foreground text-small whitespace-nowrap tabular-nums" aria-live="polite">
              {hayFiltros
                ? `${formatNumero(filtradas.length)} de ${formatNumero(rows.length)}`
                : `${formatNumero(rows.length)} en total`}
            </p>
            {csvName && (
              <Button
                variant="outline"
                size="sm"
                onClick={descargar}
                disabled={filtradas.length === 0}
                className="cursor-pointer"
              >
                <Download strokeWidth={1.5} /> CSV
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Select
              key={f.id}
              value={valores[f.id] ?? "__todos"}
              onValueChange={(v) => {
                setValores((s) => ({ ...s, [f.id]: v }));
                setPagina(0);
              }}
            >
              <SelectTrigger size="sm" aria-label={f.label} className="min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos">{f.allLabel ?? `${f.label}: todos`}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {dateOf && (
            <Select
              value={rango}
              onValueChange={(v) => {
                setRango(v as Rango);
                setPagina(0);
              }}
            >
              <SelectTrigger size="sm" aria-label="Rango de fechas" className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hayFiltros && (
            <Button variant="ghost" size="sm" onClick={limpiar} className="cursor-pointer">
              <X strokeWidth={1.5} /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-card border">
          <EmptyState
            icon={SearchX}
            title="Nada coincide con esos filtros"
            description="Prueba con otra búsqueda o limpia los filtros."
            action={
              <Button variant="outline" size="sm" onClick={limpiar} className="cursor-pointer">
                Limpiar filtros
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-card border md:block">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-muted">
                  {desktopCols.map((c) => (
                    <TableHead key={c.id} className={c.className} aria-sort={sort?.id === c.id ? (sort.desc ? "descending" : "ascending") : undefined}>
                      {c.sortValue ? (
                        <button
                          type="button"
                          onClick={() => ordenar(c.id)}
                          className="hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-chip"
                        >
                          {c.header}
                          {sort?.id === c.id &&
                            (sort.desc ? (
                              <ArrowDown className="size-3.5" strokeWidth={2} aria-hidden />
                            ) : (
                              <ArrowUp className="size-3.5" strokeWidth={2} aria-hidden />
                            ))}
                        </button>
                      ) : (
                        c.header
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((r) => (
                  <TableRow
                    key={getRowId(r)}
                    className={cn(detail && "cursor-pointer", rowClassName?.(r))}
                    onClick={detail ? () => setSel(r) : undefined}
                  >
                    {desktopCols.map((c) => (
                      <TableCell key={c.id} className={c.className}>
                        {c.cell(r)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Móvil: bloques apilados */}
          <ul className="flex flex-col divide-y rounded-card border md:hidden">
            {visibles.map((r) => (
              <li key={getRowId(r)} className={rowClassName?.(r)}>
                <div
                  role={detail ? "button" : undefined}
                  tabIndex={detail ? 0 : undefined}
                  onClick={detail ? () => setSel(r) : undefined}
                  onKeyDown={detail ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(r)) : undefined}
                  className={cn("flex flex-col gap-2 p-4", detail && "cursor-pointer")}
                >
                  {primaryCol && <div className="text-base font-semibold">{primaryCol.cell(r)}</div>}
                  <dl className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-small">
                    {mobileCols.map((c) => (
                      <div key={c.id} className="contents">
                        <dt className="text-muted-foreground">{c.header}</dt>
                        <dd className="min-w-0 break-words">{c.cell(r)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            ))}
          </ul>

          {paginas > 1 && (
            <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
              <p className="text-muted-foreground text-small tabular-nums">
                {formatNumero(paginaActual * POR_PAGINA + 1)} a{" "}
                {formatNumero(Math.min((paginaActual + 1) * POR_PAGINA, filtradas.length))} de{" "}
                {formatNumero(filtradas.length)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPagina(paginaActual - 1)}
                  disabled={paginaActual === 0}
                  aria-label="Página anterior"
                  className="cursor-pointer"
                >
                  <ChevronLeft strokeWidth={1.5} />
                </Button>
                <span className="text-small tabular-nums">
                  {paginaActual + 1} de {paginas}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPagina(paginaActual + 1)}
                  disabled={paginaActual >= paginas - 1}
                  aria-label="Página siguiente"
                  className="cursor-pointer"
                >
                  <ChevronRight strokeWidth={1.5} />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      {detail && (
        <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
          <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
            {sel && (
              <>
                <SheetHeader className="border-b p-5 pr-14">
                  <SheetTitle className="font-display text-h3 font-bold">{detailTitle?.(sel) ?? "Detalle"}</SheetTitle>
                  <SheetDescription className="sr-only">Detalle del registro seleccionado</SheetDescription>
                </SheetHeader>
                <div className="p-5">{detail(sel)}</div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

/** Lista de datos para el panel de detalle: etiqueta en Grafito, valor debajo. */
export function DetailList({ items }: { items: { label: string; value: React.ReactNode; full?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
      {items.map((it) => (
        <div key={it.label} className={cn("grid min-w-0 gap-1", it.full && "col-span-2")}>
          <dt className="text-muted-foreground text-label">{it.label}</dt>
          <dd className="min-w-0 text-small font-medium break-words">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Valor vacío uniforme en celdas y detalle. */
export function Vacio({ children = "Sin dato" }: { children?: React.ReactNode }) {
  return <span className="text-muted-foreground font-normal">{children}</span>;
}
