import { redirect } from "next/navigation";

// Ruta antigua: la sección ahora se llama "Asesorías".
export default function LeadsAsesoriaRedirect() {
  redirect("/admin/asesorias");
}
