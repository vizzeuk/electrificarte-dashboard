import { PageHeader } from "@/components/page-header";
import { MiCuentaForm } from "@/components/mi-cuenta-form";
import { getCurrentVendor } from "@/lib/auth/vendor";

export const dynamic = "force-dynamic";

export default async function MiCuentaPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null; // el layout de /vendedor ya gatea la sesión

  return (
    <>
      <PageHeader
        title="Mi cuenta y mis datos"
        subtitle="Los datos personales que Electrificarte tiene sobre ti. Puedes verlos, corregirlos o pedir que se eliminen."
      />
      <MiCuentaForm vendor={vendor} />
    </>
  );
}
