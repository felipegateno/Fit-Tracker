import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import TopNav from "@/components/TopNav"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fit Tracker",
  description: "Dashboard de nutrición y actividad física",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-950 text-white">
        <TopNav />
        <main className="max-w-[480px] mx-auto pb-10">
          {children}
        </main>
      </body>
    </html>
  )
}
