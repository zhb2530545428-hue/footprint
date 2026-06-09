/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production builds from overwriting a running dev server's cache.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  images: {
    // v1 uses local object URLs; disable remote image optimization
    unoptimized: true,
  },
};

module.exports = nextConfig;
