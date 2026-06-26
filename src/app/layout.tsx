import type { Metadata } from "next"
import "./globals.css"
import { UpdateNotice } from "@/shared/components/UpdateNotice"

// Fuentes del sistema (sin descargar de Google Fonts) para que el build de Vercel
// nunca falle por un error temporal de red al traer las fuentes.
const fontVars = {
  "--font-geist-sans": 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  "--font-geist-mono": 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
} as React.CSSProperties

export const metadata: Metadata = {
  title: "CRM Comercial",
  description: "Sistema de Gestión de Relaciones Comerciales",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased" style={fontVars}>
      <body className="min-h-full flex flex-col">{children}<UpdateNotice /></body>
    </html>
  )
}
