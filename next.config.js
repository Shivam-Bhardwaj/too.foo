/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  // Exclude portfolio directory from build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Only build files in app directory
  distDir: 'out',
}

module.exports = nextConfig

