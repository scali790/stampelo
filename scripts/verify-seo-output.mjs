import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist/public");
const indexed = [
  ["index.html","/"],["editor.html","/editor"],["pdf-editor.html","/pdf-editor"],["about.html","/about"],["pricing.html","/pricing"],["templates.html","/templates"],["templates-business-stamps.html","/templates/business-stamps"],["templates-notary-stamps.html","/templates/notary-stamps"],["templates-medical-stamps.html","/templates/medical-stamps"],["templates-status-stamps.html","/templates/status-stamps"],["templates-approved-stamp.html","/templates/approved-stamp"],["templates-received-stamp.html","/templates/received-stamp"],["templates-paid-stamp.html","/templates/paid-stamp"],["templates-confidential-stamp.html","/templates/confidential-stamp"],["guides-what-is-a-digital-stamp.html","/guides/what-is-a-digital-stamp"],["guides-how-to-add-a-stamp-to-a-pdf.html","/guides/how-to-add-a-stamp-to-a-pdf"],["guides-png-vs-svg-vs-pdf-stamp.html","/guides/png-vs-svg-vs-pdf-stamp"],["guides-company-stamp-requirements.html","/guides/company-stamp-requirements"],["guides-digital-vs-rubber-stamp.html","/guides/digital-vs-rubber-stamp"],["guides-round-vs-rectangular-stamp.html","/guides/round-vs-rectangular-stamp"],["guides-transparent-png-stamp.html","/guides/transparent-png-stamp"],["faq.html","/faq"],["privacy.html","/privacy"],["terms.html","/terms"],["refund.html","/refund"],
];
const privatePages = [["account.html","/account"],["admin.html","/admin"],["download.html","/download"],["404.html","/404"]];
for (const [file,route] of indexed) verify(file,route,"index,follow");
for (const [file,route] of privatePages) verify(file,route,"noindex,nofollow,noarchive");
for (const [file] of indexed.filter(([f]) => !["privacy.html","terms.html","refund.html"].includes(f))) {
  const html = read(file);
  assert(html.includes('type="application/ld+json"'), `${file} contains JSON-LD`);
}
const homepage = read("index.html");
assert(homepage.includes("What is Stampelo") || homepage.includes("Online Digital Stamp"), "homepage exposes extractable entity content");
assert(!homepage.toLowerCase().includes("join thousands"), "homepage contains no unsupported customer-volume claim");
assert(!homepage.includes("%VITE_ANALYTICS_"), "homepage has no unresolved analytics placeholders");
const robots = read("robots.txt");
for (const route of ["/api/","/account","/admin","/download"]) assert(robots.includes(`Disallow: ${route}`), `robots disallows ${route}`);
assert(robots.includes("Sitemap: https://www.stampelo.com/sitemap.xml"), "robots references canonical sitemap");
const sitemap = read("sitemap.xml");
for (const [,route] of indexed.filter(([,r]) => !["/privacy","/terms","/refund"].includes(r))) assert(sitemap.includes(route === "/" ? "https://www.stampelo.com/" : `https://www.stampelo.com${route}`), `sitemap includes ${route}`);
for (const [,route] of privatePages) assert(!sitemap.includes(`https://www.stampelo.com${route}`), `sitemap excludes ${route}`);
console.log("[seo] verification passed");
function verify(file,route,robots){const html=read(file);const canonical=route==="/"?"https://www.stampelo.com/":`https://www.stampelo.com${route}`;assert(html.includes(`<link rel="canonical" href="${canonical}"`),`${file} canonical`);assert(html.includes(`<meta name="robots" content="${robots}"`),`${file} robots`);assert(/<div id="root">\s*<main/i.test(html),`${file} crawlable body`)}
function read(file){const p=path.join(distDir,file);assert(fs.existsSync(p),`${file} exists`);return fs.readFileSync(p,"utf8")}
function assert(condition,message){if(!condition){console.error(`[seo] FAILED: ${message}`);process.exit(1)}console.log(`[seo] ok: ${message}`)}
