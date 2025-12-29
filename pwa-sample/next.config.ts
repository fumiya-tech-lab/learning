/** @type {import('next').NextConfig} */
const nextConfig = {
  // ビルド時の TypeScript エラーを無視する
  typescript: {
    ignoreBuildErrors: true,
  },
  // ビルド時の ESLint エラーを無視する
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;