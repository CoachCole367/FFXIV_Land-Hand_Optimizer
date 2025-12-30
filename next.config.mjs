/** @type {import('next').NextConfig} */
const repoName = process.env.NEXT_PUBLIC_BASE_PATH || '';
const basePath = repoName ? `/${repoName.replace(/^\/+|\/+$/g, '')}` : '';

const nextConfig = {
  reactStrictMode: true,
  // Keep optional base paths for deployments that need it, but allow the runtime
  // server to handle API routes so interactive flows (search, presets) work.
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
