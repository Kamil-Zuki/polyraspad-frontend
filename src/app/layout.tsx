import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
// @ts-ignore: allow side-effect CSS import without type declarations
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { EntitlementProvider } from "@/contexts/entitlement-context"
import { ProjectProvider } from "@/contexts/project-context"
import { OmnibarProvider } from "@/contexts/omnibar-context"
import { Omnibar } from "@/components/omnibar/omnibar"
import { ReactQueryProvider } from "@/lib/react-query/query-client"
import { AppLayout } from "@/components/layout/app-layout"
import { ErrorBoundary } from "@/components/error-boundary"
import { FontAwesomeLoader } from "@/components/font-awesome-loader"
import { Toaster } from "@/components/ui/sonner"
import { LimitPaywallModal } from "@/components/billing/limit-paywall-modal"

export const metadata: Metadata = {
  title: {
    default: "Polyraspad",
    template: "%s | Polyraspad",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  description: "Personal Vocabulary Learning Platform - learn languages effectively",
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
    { media: "(prefers-color-scheme: light)", color: "#0B0F15" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F15" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning className="dark">
      <body className="font-sans antialiased">
        <FontAwesomeLoader />
        <ErrorBoundary>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ReactQueryProvider>
              <AuthProvider>
                <EntitlementProvider>
                <ProjectProvider>
                  <OmnibarProvider>
                    <Omnibar />
                    <LimitPaywallModal />
                    <AppLayout>{children}</AppLayout>
                  </OmnibarProvider>
                  <Toaster richColors closeButton />
                </ProjectProvider>
                </EntitlementProvider>
              </AuthProvider>
            </ReactQueryProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

