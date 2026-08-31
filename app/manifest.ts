import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Kiwi Farm",
        short_name: "Kiwi Farm",
        description: "Kiwi inventory and workflow management",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
    };
}