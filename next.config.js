/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // v1 uses local object URLs; disable remote image optimization
    unoptimized: true,
  },
};

module.exports = nextConfig;
