/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Required for Vercel
  output: 'standalone',
  // Handle API routes properly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/api/:path*' 
          : '/api/:path*',
      },
    ]
  },
  // Handle static exports
  trailingSlash: true,
  // Enable React Strict Mode
  reactStrictMode: true,
}

export default nextConfig
