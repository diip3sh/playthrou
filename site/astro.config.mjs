import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import markdownLayer from "./src/integrations/markdown-layer";

const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (production ? `https://${production}` : "https://playthrou.diip3sh.xyz");

export default defineConfig({
  site,
  integrations: [react(), markdownLayer()],
  vite: { plugins: [tailwindcss()] },
});
