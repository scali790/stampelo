import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist/public");
const sourcePath = path.join(distDir, "index.html");
const canonicalOrigin = "https://www.stampelo.com";

if (!fs.existsSync(sourcePath)) {
  throw new Error(`[seo] Missing Vite output: ${sourcePath}`);
}

const source = fs.readFileSync(sourcePath, "utf8");

const entityDescription =
  "Stampelo is an online digital stamp and seal creator with a browser-based editor, 300+ customizable templates, multiple stamp shapes, custom SVG uploads, export in PNG, SVG, EPS, PDF and DOCX, and a tool to apply stamps directly to PDF documents.";

const pages = [
  {
    route: "/",
    file: "index.html",
    title: "Stampelo — Online Digital Stamp & Seal Creator",
    description:
      "Create professional digital stamps and seals online with 300+ customizable templates. Export PNG, SVG, EPS, PDF or DOCX and place stamps directly on PDF documents.",
    index: true,
    body: `
      <main data-seo-shell="home">
        <h1>Online Digital Stamp and Seal Creator</h1>
        <p>${entityDescription}</p>
        <h2>What can you create with Stampelo?</h2>
        <p>Create round, oval, rectangular and triangular stamp designs, add text and icons, upload custom SVG artwork, and export files for digital or print use.</p>
        <h2>Which file formats does Stampelo export?</h2>
        <p>Stampelo supports PNG, SVG, EPS, PDF and DOCX export. PNG exports can use transparent backgrounds, while SVG and EPS provide scalable vector output.</p>
        <h2>Can Stampelo place a stamp on a PDF?</h2>
        <p>Yes. The PDF Stamp Editor lets you upload a PDF, position a stamp on a page and export the stamped document.</p>
        <p><a href="/editor">Create a stamp</a> · <a href="/pdf-editor">Stamp a PDF</a></p>
      </main>`,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${canonicalOrigin}/#organization`,
          name: "Stampelo",
          url: `${canonicalOrigin}/`,
          description: entityDescription,
        },
        {
          "@type": "WebSite",
          "@id": `${canonicalOrigin}/#website`,
          url: `${canonicalOrigin}/`,
          name: "Stampelo",
          description: entityDescription,
          publisher: { "@id": `${canonicalOrigin}/#organization` },
        },
        {
          "@type": "WebApplication",
          "@id": `${canonicalOrigin}/#application`,
          name: "Stampelo",
          url: `${canonicalOrigin}/`,
          applicationCategory: "DesignApplication",
          operatingSystem: "Web browser",
          description: entityDescription,
          publisher: { "@id": `${canonicalOrigin}/#organization` },
        },
      ],
    },
  },
  {
    route: "/editor",
    file: "editor.html",
    title: "Online Stamp Maker — Create a Custom Stamp | Stampelo",
    description:
      "Create a custom digital stamp online with Stampelo. Choose a template or design from scratch, customize text, shapes and icons, then export your finished stamp.",
    index: true,
    body: `
      <main data-seo-shell="editor">
        <h1>Online Stamp Maker</h1>
        <p>Use Stampelo's browser-based stamp editor to create a digital stamp or seal from a template or from scratch. Customize text, shapes, icons and effects before export.</p>
        <p>Supported output formats include PNG, SVG, EPS, PDF and DOCX, depending on the selected download option.</p>
        <p><a href="/">About Stampelo</a> · <a href="/pdf-editor">Stamp a PDF document</a></p>
      </main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Stampelo Online Stamp Maker",
      url: `${canonicalOrigin}/editor`,
      applicationCategory: "DesignApplication",
      operatingSystem: "Web browser",
      description:
        "Browser-based editor for creating custom digital stamps and seals with text, shapes, icons, templates and export formats including PNG, SVG, EPS, PDF and DOCX.",
    },
  },
  {
    route: "/pdf-editor",
    file: "pdf-editor.html",
    title: "Add a Stamp to a PDF Online | Stampelo PDF Stamp Editor",
    description:
      "Upload a PDF, position your Stampelo stamp on the required page and export the stamped PDF document online.",
    index: true,
    body: `
      <main data-seo-shell="pdf-editor">
        <h1>Add a Stamp to a PDF Online</h1>
        <p>Stampelo's PDF Stamp Editor lets you upload an existing PDF, place a digital stamp on a selected page, adjust its position and export the stamped PDF.</p>
        <p><a href="/editor">Create a stamp first</a> · <a href="/">About Stampelo</a></p>
      </main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Stampelo PDF Stamp Editor",
      url: `${canonicalOrigin}/pdf-editor`,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web browser",
      description:
        "Browser-based tool for placing a digital stamp on an uploaded PDF document and exporting the stamped PDF.",
    },
  },
  {
    route: "/privacy",
    file: "privacy.html",
    title: "Privacy Policy | Stampelo",
    description: "Stampelo privacy policy.",
    index: true,
    body: `<main data-seo-shell="legal"><h1>Stampelo Privacy Policy</h1><p>This page contains Stampelo's privacy information.</p></main>`,
  },
  {
    route: "/terms",
    file: "terms.html",
    title: "Terms of Service | Stampelo",
    description: "Stampelo terms of service.",
    index: true,
    body: `<main data-seo-shell="legal"><h1>Stampelo Terms of Service</h1><p>This page contains the terms that apply to the Stampelo service.</p></main>`,
  },
  {
    route: "/refund",
    file: "refund.html",
    title: "Refund Policy | Stampelo",
    description: "Stampelo refund policy.",
    index: true,
    body: `<main data-seo-shell="legal"><h1>Stampelo Refund Policy</h1><p>This page contains Stampelo's refund policy.</p></main>`,
  },
  {
    route: "/account",
    file: "account.html",
    title: "My Account | Stampelo",
    description: "Manage your Stampelo account and saved designs.",
    index: false,
    body: `<main data-seo-shell="private"><h1>Stampelo Account</h1><p>This account area is not intended for search indexing.</p></main>`,
  },
  {
    route: "/admin",
    file: "admin.html",
    title: "Administration | Stampelo",
    description: "Stampelo administration area.",
    index: false,
    body: `<main data-seo-shell="private"><h1>Stampelo Administration</h1><p>This administration area is not intended for search indexing.</p></main>`,
  },
  {
    route: "/download",
    file: "download.html",
    title: "Download | Stampelo",
    description: "Stampelo download page.",
    index: false,
    body: `<main data-seo-shell="private"><h1>Stampelo Download</h1><p>This transactional page is not intended for search indexing.</p></main>`,
  },
];

function setMeta(html, { title, description, route, index, body, schema }) {
  const canonical = route === "/" ? `${canonicalOrigin}/` : `${canonicalOrigin}${route}`;
  let out = html;

  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  out = replaceMeta(out, "name", "description", description);
  out = replaceMeta(out, "property", "og:title", title);
  out = replaceMeta(out, "property", "og:description", description);
  out = replaceMeta(out, "property", "og:url", canonical);
  out = replaceMeta(out, "name", "twitter:title", title);
  out = replaceMeta(out, "name", "twitter:description", description);

  out = out.replace(
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${canonical}" />`
  );

  const robotsTag = `<meta name="robots" content="${index ? "index,follow" : "noindex,nofollow,noarchive"}" />`;
  if (/<meta\s+name=["']robots["']/i.test(out)) {
    out = out.replace(/<meta\s+name=["']robots["'][^>]*>/i, robotsTag);
  } else {
    out = out.replace("</head>", `  ${robotsTag}\n</head>`);
  }

  if (schema) {
    const jsonLd = `<script type="application/ld+json">${safeJson(schema)}</script>`;
    out = out.replace("</head>", `  ${jsonLd}\n</head>`);
  }

  // Vite leaves these placeholders intact when analytics env vars are not configured.
  // An invalid URL must never be shipped in production HTML.
  out = out.replace(
    /\s*<script\s+defer\s+src=["']%VITE_ANALYTICS_ENDPOINT%\/umami["'][\s\S]*?<\/script>/gi,
    ""
  );

  out = out.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return out;
}

function replaceMeta(html, attr, key, value) {
  const pattern = new RegExp(`<meta\\s+${attr}=["']${escapeRegExp(key)}["'][^>]*>`, "i");
  const replacement = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", `  ${replacement}\n</head>`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

for (const page of pages) {
  const html = setMeta(source, page);
  fs.writeFileSync(path.join(distDir, page.file), html);
  console.log(`[seo] ${page.route} -> ${page.file} (${page.index ? "index" : "noindex"})`);
}

const notFound = setMeta(source, {
  route: "/404",
  title: "Page Not Found | Stampelo",
  description: "The requested Stampelo page could not be found.",
  index: false,
  body: `<main data-seo-shell="404"><h1>Page Not Found</h1><p>The requested page does not exist.</p><p><a href="/">Return to Stampelo</a></p></main>`,
});
fs.writeFileSync(path.join(distDir, "404.html"), notFound);
console.log("[seo] fallback -> 404.html (noindex)");
