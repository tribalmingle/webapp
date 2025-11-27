/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Externalize MongoDB for client components (Next.js 16 syntax)
  serverExternalPackages: ['mongodb'],
}

export default nextConfig
