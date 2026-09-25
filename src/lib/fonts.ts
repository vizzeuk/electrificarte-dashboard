import localFont from "next/font/local";

// Fuentes de marca del sistema v1 (Fontshare, licencia ITF FFL). No se versionan: las baja
// scripts/fetch-fonts.mjs a src/app/fonts/fontshare/ en predev/prebuild.

// Cabinet Grotesk: títulos de 20 px o más (font-display).
export const cabinet = localFont({
  src: [
    { path: "../app/fonts/fontshare/CabinetGrotesk-700.woff2", weight: "700" },
    { path: "../app/fonts/fontshare/CabinetGrotesk-800.woff2", weight: "800" },
  ],
  variable: "--font-cabinet",
  display: "swap",
});

// Switzer: todo lo demás, cifras y precios (font-sans, por defecto).
export const switzer = localFont({
  src: [
    { path: "../app/fonts/fontshare/Switzer-400.woff2", weight: "400" },
    { path: "../app/fonts/fontshare/Switzer-500.woff2", weight: "500" },
    { path: "../app/fonts/fontshare/Switzer-600.woff2", weight: "600" },
    { path: "../app/fonts/fontshare/Switzer-700.woff2", weight: "700" },
  ],
  variable: "--font-switzer",
  display: "swap",
});
