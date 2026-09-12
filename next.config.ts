import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phones and tablets on the current LAN to load dev-only assets/HMR.
  allowedDevOrigins: ["192.168.102.59"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
