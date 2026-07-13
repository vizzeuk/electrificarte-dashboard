import type { LeadOferta } from "./types";

/** Vendedor con el que se simula la vista /vendedor — ver mock/vendedores.ts */
export const CURRENT_VENDEDOR_ID = "v1";

export const leadsOferta: LeadOferta[] = [
  { id: "lo-01", nombre: "Camila Rojas",      email: "camila.rojas@example.com",   telefono: "+56 9 8421 3390", auto: "BYD Dolphin",         marca: "BYD",       region: "Metropolitana", comuna: "Ñuñoa",       estado: "contactado", fecha: "2026-07-08", vendedorId: "v1" },
  { id: "lo-02", nombre: "Matías Fuentes",    email: "matias.fuentes@example.com", telefono: "+56 9 7710 2245", auto: "Tesla Model 3",        marca: "Tesla",     region: "Metropolitana", comuna: "Las Condes",  estado: "cerrado",    fecha: "2026-07-05", vendedorId: "v1" },
  { id: "lo-03", nombre: "Javiera Muñoz",     email: "javiera.munoz@example.com",  telefono: "+56 9 6634 8871", auto: "MG4 Electric",         marca: "MG",        region: "Valparaíso",     comuna: "Viña del Mar",estado: "contactado", fecha: "2026-07-10", vendedorId: "v1" },
  { id: "lo-04", nombre: "Ignacio Pérez",     email: "ignacio.perez@example.com",  telefono: "+56 9 5523 1198", auto: "Kia EV6",              marca: "Kia",       region: "Metropolitana", comuna: "Maipú",       estado: "pagado",     fecha: "2026-07-12" },
  { id: "lo-05", nombre: "Francisca Soto",    email: "francisca.soto@example.com", telefono: "+56 9 4412 7765", auto: "Hyundai Kona Electric",marca: "Hyundai",   region: "Biobío",         comuna: "Concepción",  estado: "pagado",     fecha: "2026-07-11" },
  { id: "lo-06", nombre: "Benjamín Torres",   email: "benjamin.torres@example.com",telefono: "+56 9 3398 6612", auto: "BYD Yuan Plus",        marca: "BYD",       region: "Metropolitana", comuna: "La Florida",  estado: "pagado",     fecha: "2026-07-13" },
  { id: "lo-07", nombre: "Antonia Vergara",   email: "antonia.vergara@example.com",telefono: "+56 9 2287 4453", auto: "Chevrolet Bolt EUV",   marca: "Chevrolet", region: "Metropolitana", comuna: "Providencia", estado: "pendiente",  fecha: "2026-07-13" },
  { id: "lo-08", nombre: "Diego Contreras",   email: "diego.contreras@example.com",telefono: "+56 9 8871 2290", auto: "Volvo EX30",           marca: "Volvo",     region: "Metropolitana", comuna: "Vitacura",    estado: "pendiente",  fecha: "2026-07-13" },
  { id: "lo-09", nombre: "Valentina Araya",   email: "valentina.araya@example.com",telefono: "+56 9 7765 3321", auto: "Cupra Born",           marca: "Cupra",     region: "Metropolitana", comuna: "Ñuñoa",       estado: "pagado",     fecha: "2026-07-09" },
  { id: "lo-10", nombre: "Cristóbal Silva",   email: "cristobal.silva@example.com",telefono: "+56 9 6690 1187", auto: "MG ZS EV",             marca: "MG",        region: "Araucanía",      comuna: "Temuco",      estado: "pagado",     fecha: "2026-07-10" },
  { id: "lo-11", nombre: "Josefa Herrera",    email: "josefa.herrera@example.com", telefono: "+56 9 5544 9987", auto: "Tesla Model Y",        marca: "Tesla",     region: "Metropolitana", comuna: "Las Condes",  estado: "contactado", fecha: "2026-07-07", vendedorId: "v1" },
  { id: "lo-12", nombre: "Tomás Espinoza",    email: "tomas.espinoza@example.com", telefono: "+56 9 4433 7712", auto: "Hyundai Ioniq 5",      marca: "Hyundai",   region: "Metropolitana", comuna: "Huechuraba",  estado: "pagado",     fecha: "2026-07-12" },
  { id: "lo-13", nombre: "Fernanda Castillo", email: "fernanda.castillo@example.com", telefono: "+56 9 3321 8845", auto: "GWM Ora 03",       marca: "GWM",       region: "Valparaíso",     comuna: "Valparaíso",  estado: "pendiente",  fecha: "2026-07-13" },
  { id: "lo-14", nombre: "Sebastián Morales", email: "sebastian.morales@example.com", telefono: "+56 9 2298 6634", auto: "BYD Song Plus",    marca: "BYD",       region: "Metropolitana", comuna: "Puente Alto", estado: "cerrado",    fecha: "2026-07-03", vendedorId: "v1" },
  { id: "lo-15", nombre: "Catalina Reyes",    email: "catalina.reyes@example.com", telefono: "+56 9 8812 4456", auto: "Deepal S07",           marca: "Deepal",    region: "Metropolitana", comuna: "San Miguel",  estado: "pagado",     fecha: "2026-07-11" },
  { id: "lo-16", nombre: "Nicolás Bravo",     email: "nicolas.bravo@example.com",  telefono: "+56 9 7723 5591", auto: "JAC E-JS4",            marca: "JAC",       region: "Los Lagos",      comuna: "Puerto Montt",estado: "pagado",     fecha: "2026-07-08" },
  { id: "lo-17", nombre: "Isidora Campos",    email: "isidora.campos@example.com", telefono: "+56 9 6698 3312", auto: "Tesla Model 3",        marca: "Tesla",     region: "Metropolitana", comuna: "Ñuñoa",       estado: "contactado", fecha: "2026-07-06", vendedorId: "v1" },
  { id: "lo-18", nombre: "Vicente Pizarro",   email: "vicente.pizarro@example.com",telefono: "+56 9 5567 2298", auto: "Kia EV6",              marca: "Kia",       region: "Metropolitana", comuna: "Macul",       estado: "pendiente",  fecha: "2026-07-13" },
];
