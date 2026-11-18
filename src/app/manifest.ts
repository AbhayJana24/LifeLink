import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeLink — Blood & Plasma Donor Finder (Delhi NCR)",
    short_name: "LifeLink",
    description:
      "Geospatial blood & plasma donor matcher for Delhi NCR with PostGIS, Leaflet maps, SMS alerts, and offline donor ID card.",
    start_url: "/find",
    display: "standalone",
    background_color: "#fffafa",
    theme_color: "#dc2626",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
