import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskmaster/core"],
  serverExternalPackages: ["@cursor/sdk"],
};

export default nextConfig;
