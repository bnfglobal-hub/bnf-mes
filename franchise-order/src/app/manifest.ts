import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BNF 프랜차이즈 물류",
    short_name: "BNF 발주",
    description: "비엔에프글로벌 가맹점 발주 시스템",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
