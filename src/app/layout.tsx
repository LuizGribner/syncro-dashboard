import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Syncro Solutions — Dashboard',
  description: 'Gestão de projetos e equipe da Syncro Solutions LLC',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
