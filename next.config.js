/** @type {import('next').NextConfig} */
const isTauriBuild = process.env.TAURI_BUILD === "1";

const nextConfig = {
  output: isTauriBuild ? "export" : undefined,
  distDir: isTauriBuild ? "out" : ".next",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
