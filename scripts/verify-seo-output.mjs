import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist/public");
const checks = [
  ["index.html", "https://www.stampelo.com/", "index,follow"],
  ["editor.html", "https://www.stampelo.com/editor", "index,follow"],
  ["pdf-editor.html", "https://www.stampelo.com/pdf-editor", "index,follow"],
  ["privacy.html", "https://www.stampelo.com/privacy", "index,follow"],
  ["terms.html", "https://www.stampelo.com/terms", "index,follow"],
  ["refund.html", "https://www.stampelo.com/refund", "index,follow"],
  ["account.html", "https://www.stampelo.com/account", "noindex,nofollow,noarchive"],
  ["admin.html", "https://www.stampelo.com/admin", "noindex,nofollow,noarchive"],
  ["download.html", "https://www.stampelo.com/download", "noindex,nofollow,noarchive"],
  ["404.html", "https://www.stampelo.com/404", "noindex,nofollow,noarchive"],
];

for (const [file, canonical, robots] of checks) {
  const fullPath = path.join(distDir, file);
  assert(fs.existsSync(fullPath), `${file} exists`);
  const html = fs.readFileSync(fullPath, "utf8");
  assert(html.includes(`<link rel="canonical" href="${canonical}"`), `${file} canonical is ${canonical}`);
  assert(html.includes(`<meta name="robots" content="${robots}"`), `${file} robots is ${robots}`);
  assert(html.includes("data-seo-shell="), `${file} contains crawlable fallback content`);
  assert(!html.includes("%VITE_ANALYTICS_ENDPOINT%"), `${file} has no unresolved analytics placeholder`);
}

for (const file of ["index.html", "editor.html", "pdf-editor.html"]) {
  const html = fs.readFileSync(path.join(distDir, file), "utf8");
  assert(html.includes('type="application/ld+json"'), `${file} contains JSON-LD`);
}

const robotsTxt = fs.readFileSync(path.join(distDir, "robots.txt"), "utf8");
for (const route of ["/api/", "/account", "/admin", "/download"]) assert(robotsTxt.includes(`Disallow: ${route}`), `robots.txt disallows ${route}`);
assert(robotsTxt.includes("Sitemap: https://www.stampelo.com/sitemap.xml"), "robots.txt references canonical sitemap");

const sitemap = fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf8");
for (const route of ["/account", "/admin", "/download"]) assert(!sitemap.includes(`https://www.stampelo.com${route}`), `sitemap excludes ${route}`);
console.log("[seo] verification passed");

function assert(condition, message) { if (!condition) { console.error(`[seo] FAILED: ${message}`); process.exit(1); } console.log(`[seo] ok: ${message}`); }
