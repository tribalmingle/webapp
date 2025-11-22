import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import { SegmentLoader } from "@/components/analytics/segment-loader"
import { LaunchDarklyProvider } from "@/components/feature-flags/launchdarkly-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Tribal Mingle · Culture-first dating",
  description: "The official waitlist and storytelling hub for the tribe-first dating ecosystem.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LaunchDarklyProvider>
          <SegmentLoader />
          {children}
        </LaunchDarklyProvider>
      </body>
    </html>
  )
}
