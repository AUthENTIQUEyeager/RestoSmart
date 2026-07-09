import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegisterSW } from '@/components/RegisterSW'

export const metadata: Metadata = {
  title: 'RestoSmart — Gestion de restaurant',
  description: 'Système de commande digital pour restaurant',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#E8650A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-bg text-textdark antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  )
}
