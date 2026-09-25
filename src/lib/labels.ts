// Etiquetas legibles para valores internos de las tablas.

const FUENTES: Record<string, string> = {
  web: "Sitio web",
  hero: "Portada",
  home: "Portada",
  pdp: "Ficha de auto",
  plp: "Listado de autos",
  comparador: "Comparador",
  chatbot: "Chatbot",
  sticky: "Barra fija",
  footer: "Pie de página",
  popup: "Ventana emergente",
  demo: "Demo",
  form: "Formulario",
  "dashboard-test": "Prueba",
};

/** "pdp" → "Ficha de auto"; valores desconocidos se muestran con mayúscula inicial. */
export function fuenteLabel(v: string | null | undefined): string {
  const k = (v ?? "").trim();
  if (!k) return "Sin dato";
  return FUENTES[k.toLowerCase()] ?? k.charAt(0).toLocaleUpperCase("es-CL") + k.slice(1);
}

const FINANCIAMIENTO: Record<string, string> = {
  contado: "Contado",
  "credito-convencional": "Crédito convencional",
  "credito-inteligente": "Crédito inteligente",
  leasing: "Leasing",
};

/** "credito-inteligente" → "Crédito inteligente". */
export function financiamientoLabel(v: string | null | undefined): string | null {
  const k = (v ?? "").trim();
  if (!k) return null;
  const f = FINANCIAMIENTO[k.toLowerCase()];
  if (f) return f;
  const t = k.replace(/[-_]+/g, " ");
  return t.charAt(0).toLocaleUpperCase("es-CL") + t.slice(1);
}
