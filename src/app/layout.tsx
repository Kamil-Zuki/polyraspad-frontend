import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ReactQueryProvider } from "@/lib/react-query/query-client"
import { AppLayout } from "@/components/layout/app-layout"
import { ErrorBoundary } from "@/components/error-boundary"
import { FontAwesomeLoader } from "@/components/font-awesome-loader"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Polyraspad",
    template: "%s | Polyraspad",
  },
  description: "Personal Vocabulary Learning Platform - изучайте языки эффективно",
  keywords: ["vocabulary", "language learning", "SRS", "spaced repetition"],
  authors: [{ name: "Polyraspad Team" }],
  creator: "Polyraspad",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Polyraspad",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b0f19" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <FontAwesomeLoader />
        <ErrorBoundary>
          <ReactQueryProvider>
            <AuthProvider>
              <AppLayout>{children}</AppLayout>
            </AuthProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
