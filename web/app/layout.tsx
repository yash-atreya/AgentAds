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