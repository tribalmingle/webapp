import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  i18n: {
    locales: ["en", "fr", "pt", "ar"],
    defaultLocale: "en",
    localeDetection: false,
  },
  experimental: {
    optimizeCss: true,
  },
}

export default nextConfig
