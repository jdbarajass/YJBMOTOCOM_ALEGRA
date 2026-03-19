import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YJBMOTOCOM - Gestión de Ventas',
  description: 'Sistema de cierre de caja y análisis para YJBMOTOCOM - Accesorios para Motos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
