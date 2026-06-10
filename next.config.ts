import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone", // to copy exact files needed for production
};

export default nextConfig;
