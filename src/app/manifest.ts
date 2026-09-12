import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "ReFruits",
        short_name: "ReFruits",
        description: "収穫から出荷までをつなぐ農園管理アプリ",
        id: "/",
        scope: "/",
        start_url: "/home",
        display: "standalone",
        background_color: "#fff8e7",
        theme_color: "#4caf50",
        lang: "ja",
        categories: ["business", "productivity"],
        icons: [
            {
                src: "/icons/refruits-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/refruits-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icons/refruits-maskable-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
