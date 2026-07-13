"use client";

import { useState } from "react";
import { LeadsOfertaTable } from "@/components/leads-oferta-table";
import { OfertarDialog } from "@/components/ofertar-dialog";
import { leadsDisponiblesVendedor } from "@/lib/mock/derived";

export default function LeadsDisponiblesPage() {
  const [ofertados, setOfertados] = useState<Set<string>>(new Set());
  const leads = leadsDisponiblesVendedor().filter((l) => !ofertados.has(l.id));

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads disponibles</h1>
        <p className="text-muted-foreground">
          Leads pagados aún sin vendedor asignado — {leads.length} disponibles para ofertar.
        </p>
      </div>
      <LeadsOfertaTable
        leads={leads}
        actionColumn={(lead) => (
          <OfertarDialog
            lead={lead}
            onConfirm={() => setOfertados((prev) => new Set(prev).add(lead.id))}
          />
        )}
      />
    </div>
  );
}
