import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phones and tablets on the current LAN to load dev-only assets/HMR.
  allowedDevOrigins: ["192.168.102.59"],
};

export default nextConfig;
