import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Crave it, Tap it, Get it',
  description: 'South Africa\'s premium food delivery platform for butcheries, restaurants, and specialty food shops',
  manifest: '/manifest.json',
  themeColor: '#667eea',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sella',
  },
  icons: {`n    icon: '/website-images/favicon.png',`n    shortcut: '/website-images/favicon.png',`n    apple: '/icon-192x192.png',`n  },`n  openGraph: {`n    images: [{ url: '/website-images/sella-thumbnail.png' }],`n  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sella" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="icon" type="image/png" href="/website-images/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/website-images/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <div id="root" className="min-h-screen bg-white">
          {children}
        </div>
      </body>
    </html>
  )
}

