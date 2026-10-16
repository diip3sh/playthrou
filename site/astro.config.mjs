import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (production ? `https://${production}` : "https://playthru.vercel.app");

export default defineConfig({
  site,
  vite: { plugins: [tailwindcss()] },
});
