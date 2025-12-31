import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SafeTravel Monitor - Real-Time Travel Safety Intelligence',
  description: 'Know before you go. Real-time safety intelligence for every destination on Earth, powered by analysis of global news coverage in 100+ languages.',
  keywords: ['travel safety', 'travel alerts', 'safety monitor', 'travel risk', 'destination safety', 'GDELT', 'travel intelligence'],
  authors: [{ name: 'SafeTravel Monitor' }],
  creator: 'SafeTravel Monitor',
  publisher: 'SafeTravel Monitor',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://safetravel.example.com',
    title: 'SafeTravel Monitor - Real-Time Travel Safety Intelligence',
    description: 'Know before you go. Real-time safety intelligence for every destination on Earth.',
    siteName: 'SafeTravel Monitor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafeTravel Monitor - Real-Time Travel Safety Intelligence',
    description: 'Know before you go. Real-time safety intelligence for every destination on Earth.',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SafeTravel Monitor',
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SafeTravel" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
