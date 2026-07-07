/**
 * AutoEskil – Prerender-skript för SEO
 *
 * Körs efter `vite build` och genererar statiska HTML-filer för varje route.
 * Google kan då läsa riktigt innehåll utan att köra JavaScript.
 *
 * Kör med: node scripts/prerender.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "../dist");
const indexHtml = readFileSync(join(distDir, "index.html"), "utf-8");

// Alla publika routes som Google ska indexera
const routes = [
  {
    path: "/",
    title: "AutoEskil – Bilförmedling i Eskilstuna | Begagnade Bilar",
    description:
      "AutoEskil är Eskilstunas ledande bilförmedling. Köp begagnad bil, sälj din bil eller lämna en intresseanmälan – vi matchar dig med rätt fordon inom 24h.",
    canonical: "https://autoeskil.se/",
  },
  {
    path: "/bilar",
    title: "Begagnade Bilar i Eskilstuna – AutoEskil",
    description:
      "Bläddra bland vårt handplockade sortiment av begagnade bilar i Eskilstuna. Filtrera på märke, drivmedel, pris och miltal.",
    canonical: "https://autoeskil.se/bilar",
  },
  {
    path: "/om-oss",
    title: "Om AutoEskil – Din Bilförmedling i Eskilstuna",
    description:
      "Lär känna AutoEskil. Grundat 2014 i Eskilstuna med passion för bilar och personlig service. Vi förmedlar kvalitetsbilar med full transparens.",
    canonical: "https://autoeskil.se/om-oss",
  },
  {
    path: "/kontakt",
    title: "Hitta Bil i Eskilstuna – Lämna Intresseanmälan | AutoEskil",
    description:
      "Berätta vad du söker och vi matchar dig med rätt bil inom 24 timmar. Lämna en enkel intresseanmälan hos AutoEskil i Eskilstuna.",
    canonical: "https://autoeskil.se/kontakt",
  },
  {
    path: "/sell-car",
    title: "Sälj Din Bil i Eskilstuna – AutoEskil",
    description:
      "Vill du sälja din bil? Lämna en säljförfrågan hos AutoEskil i Eskilstuna och få ett erbjudande snabbt. Enkel och trygg bilaffär.",
    canonical: "https://autoeskil.se/sell-car",
  },
];

function buildHtmlForRoute(route) {
  let html = indexHtml;

  // Uppdatera title
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${route.title}</title>`
  );

  // Uppdatera meta description
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${route.description}$2`
  );

  // Uppdatera canonical
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${route.canonical}$2`
  );

  // Uppdatera og:url
  html = html.replace(
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${route.canonical}$2`
  );

  // Uppdatera og:title
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${route.title}$2`
  );

  // Uppdatera og:description
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${route.description}$2`
  );

  return html;
}

console.log("🚀 AutoEskil Prerender – Genererar statiska HTML-filer...\n");

for (const route of routes) {
  const html = buildHtmlForRoute(route);

  if (route.path === "/") {
    // Startsidan → dist/index.html (redan finns, uppdatera med rätt meta)
    writeFileSync(join(distDir, "index.html"), html, "utf-8");
    console.log(`  ✅  /  →  dist/index.html`);
  } else {
    // Övriga routes → dist/<route>/index.html
    const routeDir = join(distDir, route.path);
    if (!existsSync(routeDir)) {
      mkdirSync(routeDir, { recursive: true });
    }
    writeFileSync(join(routeDir, "index.html"), html, "utf-8");
    console.log(`  ✅  ${route.path}  →  dist${route.path}/index.html`);
  }
}

console.log(
  "\n✨ Klart! Google kan nu läsa statiskt innehåll för alla routes.\n"
);
