import { Inter, Space_Grotesk } from 'next/font/google'

// Inter — cuerpo, labels, datos (alineado con electrificarteweb).
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Space Grotesk — títulos y headlines (fuente de títulos del sitio).
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
})
