// @ts-check
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { defineConfig, fontProviders } from "astro/config";

/** The folder that holds the self-hosted font files from the `@fontsource-variable` packages. */
const FONT_FILES = "./node_modules/@fontsource-variable";

/** The location of the inline theme script, which `layouts/base.astro` inlines into every page. */
const THEME_INIT_URL = new URL("src/scripts/theme-init.js", import.meta.url);
/** The script text with Unix line endings, so the hash matches the text that `layouts/base.astro` inlines on any platform. */
const THEME_INIT_TEXT = readFileSync(THEME_INIT_URL, "utf8").replaceAll("\r\n", "\n");
// The content security policy hash of the inline theme script, because the policy allows an inline script only by its hash.
/** @type {`sha256-${string}`} */
const THEME_INIT_HASH = `sha256-${createHash("sha256").update(THEME_INIT_TEXT).digest("base64")}`;

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // The repository name, because GitHub Pages serves the site from a subfolder of the user domain.
  base: "/flyrank-ml-internship",
  // Both fonts are served from the site itself, so the page makes no requests to outside font hosts.
  fonts: [
    {
      cssVariable: "--font-geist",
      fallbacks: ["system-ui", "sans-serif"],
      name: "Geist",
      options: {
        variants: [
          {
            src: [`${FONT_FILES}/geist/files/geist-latin-wght-normal.woff2`],
            style: "normal",
            weight: "100 900",
          },
        ],
      },
      provider: fontProviders.local(),
    },
    {
      cssVariable: "--font-geist-mono",
      fallbacks: ["ui-monospace", "monospace"],
      name: "Geist Mono",
      options: {
        variants: [
          {
            src: [`${FONT_FILES}/geist-mono/files/geist-mono-latin-wght-normal.woff2`],
            style: "normal",
            weight: "100 900",
          },
        ],
      },
      provider: fontProviders.local(),
    },
  ],
  // The content security policy, which `scripts/check-build.ts` checks against the built page.
  security: {
    csp: {
      algorithm: "SHA-256",
      // Everything is limited to the site's own origin, and forms, frames, objects, and workers are switched off.
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "connect-src 'self'",
        "form-action 'none'",
        "frame-src 'none'",
        "img-src 'self'",
        "object-src 'none'",
        "worker-src 'none'",
      ],
      // Astro hashes the scripts it builds, so only the hand-inlined theme script is added here.
      scriptDirective: { hashes: [THEME_INIT_HASH] },
      // Inline `style` attributes are allowed because the charts position their marks with them.
      styleDirective: { resources: [{ kind: "attribute", resource: "'unsafe-inline'" }] },
    },
  },
  // The address that canonical links and social card links are built from.
  site: "https://neilivanorencia.github.io",
  // Directory style addresses end in a slash, which matches how GitHub Pages serves folders.
  trailingSlash: "always",
});
