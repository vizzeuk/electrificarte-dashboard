import { PageHeader } from "@/components/page-header";
import { MiCuentaForm } from "@/components/mi-cuenta-form";
import { getCurrentVendor } from "@/lib/auth/vendor";

export const dynamic = "force-dynamic";

export default async function MiCuentaPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null; // el layout de /vendedor ya gatea la sesión

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Mi cuenta y mis datos"
        subtitle="Los datos personales que Electrificarte tiene sobre vos. Podés verlos, corregirlos, descargarlos o pedir que se eliminen."
      />
      <MiCuentaForm vendor={vendor} />
    </div>
  );
}
