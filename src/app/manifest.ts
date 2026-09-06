import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "ReFruits",
        short_name: "ReFruits",
        description: "収穫から出荷までをつなぐ農園管理アプリ",
        start_url: "/home",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#4caf50",
    };
}
