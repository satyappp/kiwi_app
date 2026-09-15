import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// 開発端末のIPは接続先のWi-Fi等で変わるため、現在のLANアドレスを起動時に許可する。
// 未許可だと端末ではHTMLだけが表示され、入力更新や登録処理のJSが動かない。
const lanDevOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);

const nextConfig: NextConfig = {
  // スマートフォンやタブレットから開発用アセットとHMRを読み込めるようにする。
  allowedDevOrigins: ["127.0.0.1", ...lanDevOrigins],
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
