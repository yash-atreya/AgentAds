import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AgentAds - Monetize Your AI Agent with Zero Effort',
  description: 'Reach agent-first developers instantly. Earn passive income by displaying relevant ads in your AI coding agent. Start earning in 30 seconds.',
  metadataBase: new URL('https://agentads.xyz'),
  openGraph: {
    title: 'AgentAds - Monetize Your AI Agent with Zero Effort',
    description: 'Reach agent-first developers instantly. Earn passive income by displaying relevant ads in your AI coding agent. Start earning in 30 seconds.',
    url: 'https://agentads.xyz',
    siteName: 'AgentAds',
    images: [
      {
        url: '/agentads-og-default.png',
        width: 1200,
        height: 630,
        alt: 'AgentAds - AI Agent Monetization Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentAds - Monetize Your AI Agent with Zero Effort',
    description: 'Reach agent-first developers instantly. Start earning in 30 seconds.',
    images: ['/agentads-og-default.png'],
    creator: '@agentads',
  },
  keywords: ['AI agents', 'monetization', 'developer tools', 'passive income', 'ads platform', 'agent-first', 'coding assistants'],
  authors: [{ name: 'AgentAds Team' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col font-mono" style={{ background: '#ffffff', color: '#000000' }}>
        {children}
      </body>
    </html>
  )
}