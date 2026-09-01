import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VHX Chess',
  description: 'Play chess against Stockfish 18 in your browser.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
