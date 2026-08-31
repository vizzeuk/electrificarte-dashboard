/**
 * Catálogo de marcas con las que trabaja Electrificarte (fuente: data/brands.json de
 * electrificarteweb). Se usa para el selector de "marcas que ofrece" el vendedor —
 * mejor un set cerrado que texto libre, así el filtro de tips por marca es confiable.
 */
export const MARCAS = [
  "Audi", "BMW", "BYD", "Changan", "Chery", "Chevrolet", "Cupra", "Deepal", "DFSK",
  "Dongfeng", "DS", "Fiat", "Ford", "GAC", "Geely", "GWM", "Haval", "Honda", "Hyundai",
  "JAC", "Jaecoo", "Jeep", "Jetour", "JMC", "Kia", "Leapmotor", "Lexus", "Lynk & Co",
  "Maxus", "Mazda", "Mercedes-Benz", "MG", "MINI", "Nammi", "Nissan", "Omoda", "Ora",
  "Peugeot", "Porsche", "Renault", "Riddara", "Skoda", "Smart", "Ssangyong", "Subaru",
  "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
] as const;

/** Parsea el string libre "BYD, Tesla, MG" a lista de marcas conocidas (case-insensitive). */
export function parseMarcasSeleccionadas(marcas: string | null | undefined): string[] {
  if (!marcas) return [];
  const norm = (s: string) => s.trim().toLowerCase();
  const pedidas = new Set(marcas.split(/[,;/]+/).map(norm).filter(Boolean));
  // Devuelve con la grafía canónica del catálogo.
  return MARCAS.filter((m) => pedidas.has(norm(m)));
}
