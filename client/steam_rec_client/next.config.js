/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,   // don’t fail build on lint errors
  },
  typescript: {
    ignoreBuildErrors: true,    // don’t fail build on type errors
  },
  staticPageGenerationTimeout: 600, 
};

module.exports = nextConfig;
