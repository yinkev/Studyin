/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is the default in Next 14+, no need for experimental flags.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
