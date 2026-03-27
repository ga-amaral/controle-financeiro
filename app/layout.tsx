import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from './context/AuthContext'

export const metadata: Metadata = {
  title: 'Financeiro Pessoal',
  description: 'Sistema de acompanhamento de finanças pessoais',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
