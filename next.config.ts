import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint flat-config shipped by create-next-app targets a newer
  // eslint-config-next than we pin; lint is run separately, not at build time.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
