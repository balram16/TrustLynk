import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { ChatbotProvider } from "@/components/chatbot/chatbot-provider"
import { LoadingProvider } from "@/providers/loading-provider"
import { FreighterWalletProvider } from "@/context/freighter-wallet-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TrustLynk - AI-Powered Insurance on Stellar Blockchain",
  description: "Revolutionizing insurance claims with AI, Stellar blockchain & instant XLM payouts",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FreighterWalletProvider>
            <LoadingProvider>
              <ChatbotProvider>
                {children}
                <ShadcnToaster />
                <SonnerToaster position="top-right" richColors />
              </ChatbotProvider>
            </LoadingProvider>
          </FreighterWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

