import '../styles/globals.css'
import type { Metadata } from 'next'
import { Montserrat, Poppins } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Serendib AI - AI-Powered Marketing Optimizer',
  description: 'AI-powered marketing optimization platform with strategy recommendations, content generation, and campaign predictions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${poppins.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}