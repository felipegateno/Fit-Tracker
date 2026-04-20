import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import TopBar from "@/components/TopBar"
import BottomNav from "@/components/BottomNav"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Fit Tracker",
  description: "Dashboard de nutrición y actividad física",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ft-bg text-ft-text font-sans">
        <Suspense fallback={<div className="h-[52px] bg-ft-nav border-b border-white/[0.07] flex-shrink-0" />}>
          <TopBar />
        </Suspense>
        <main
          id="app-main"
          className="flex-1 overflow-y-auto max-w-[430px] mx-auto w-full pb-20"
        >
          {children}
        </main>
        <Suspense fallback={<div className="h-[60px] bg-ft-nav border-t border-white/[0.07] flex-shrink-0 fixed bottom-0 left-0 right-0" />}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  )
}
