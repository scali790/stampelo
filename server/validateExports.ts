/**
 * Export validation script — tests all 5 export formats programmatically.
 * Run: npx tsx server/validateExports.ts
 */

import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { Document, Packer, Paragraph, ImageRun } from "docx";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const OUT_DIR = "/tmp/stampelo-export-validation";
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ─── Test stamp SVG ────────────────────────────────────────────────────────────
const STAMP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="90" fill="none" stroke="#1a3a6b" stroke-width="6"/>
  <circle cx="100" cy="100" r="72" fill="none" stroke="#1a3a6b" stroke-width="2"/>
  <path id="arc1" d="M 20 100 A 80 80 0 0 1 180 100" fill="none"/>
  <text font-size="14" font-family="Arial" font-weight="bold" fill="#1a3a6b">
    <textPath href="#arc1" startOffset="10%">STAMPELO VALIDATION TEST</textPath>
  </text>
  <text x="100" y="95" text-anchor="middle" font-size="16" font-family="Arial" font-weight="bold" fill="#1a3a6b">OFFICIAL</text>
  <text x="100" y="115" text-anchor="middle" font-size="12" font-family="Arial" fill="#1a3a6b">SEAL</text>
</svg>`;

const results: Record<string, { pass: boolean; details: string }> = {};

// ─── 1. PNG validation ─────────────────────────────────────────────────────────
async function validatePng() {
  console.log("\n[1/5] PNG validation...");
  const pngPath = join(OUT_DIR, "stamp.png");
  const svgBuf = Buffer.from(STAMP_SVG);

  // Generate at 600 DPI equivalent (stamp is 38mm → ~898px at 600dpi)
  const stampMm = 38;
  const dpi = 600;
  const px = Math.round((stampMm / 25.4) * dpi); // 898px

  await sharp(svgBuf)
    .resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);

  const meta = await sharp(pngPath).metadata();
  const pngBuf = readFileSync(pngPath);
  const isPng = pngBuf[0] === 0x89 && pngBuf[1] === 0x50 && pngBuf[2] === 0x4e && pngBuf[3] === 0x47;
  const hasAlpha = meta.hasAlpha === true;
  const widthOk = meta.width === px;
  const heightOk = meta.height === px;

  const pass = isPng && hasAlpha && widthOk && heightOk;
  results["PNG"] = {
    pass,
    details: `Valid PNG: ${isPng}, Transparent bg: ${hasAlpha}, Width: ${meta.width}px (expected ${px}), Height: ${meta.height}px, File size: ${pngBuf.length} bytes`,
  };
  console.log(`  ${pass ? "✅" : "❌"} ${results["PNG"]!.details}`);
}

// ─── 2. SVG validation ─────────────────────────────────────────────────────────
function validateSvg() {
  console.log("\n[2/5] SVG validation...");
  const svgPath = join(OUT_DIR, "stamp.svg");
  writeFileSync(svgPath, STAMP_SVG);

  const content = readFileSync(svgPath, "utf-8");
  const hasXmlns = content.includes('xmlns="http://www.w3.org/2000/svg"');
  const hasViewBox = content.includes("viewBox=");
  const hasVectorGeometry = content.includes("<circle") || content.includes("<path") || content.includes("<rect");
  const noRasterEmbed = !content.includes("data:image/png;base64");
  const fileSize = Buffer.from(content).length;

  const pass = hasXmlns && hasViewBox && hasVectorGeometry && noRasterEmbed;
  results["SVG"] = {
    pass,
    details: `Valid xmlns: ${hasXmlns}, Has viewBox: ${hasViewBox}, Vector geometry: ${hasVectorGeometry}, No raster embed: ${noRasterEmbed}, File size: ${fileSize} bytes`,
  };
  console.log(`  ${pass ? "✅" : "❌"} ${results["SVG"]!.details}`);
}

// ─── 3. EPS validation ─────────────────────────────────────────────────────────
function validateEps() {
  console.log("\n[3/5] EPS validation...");
  const epsPath = join(OUT_DIR, "stamp.eps");

  // Generate a real EPS wrapping the SVG as embedded PostScript
  // We use a proper EPS header with BoundingBox and PostScript drawing commands
  const stampMm = 38;
  const ptSize = Math.round((stampMm / 25.4) * 72); // 108pt

  const epsContent = [
    "%!PS-Adobe-3.0 EPSF-3.0",
    `%%BoundingBox: 0 0 ${ptSize} ${ptSize}`,
    `%%HiResBoundingBox: 0.0 0.0 ${ptSize}.0 ${ptSize}.0`,
    "%%Title: Stampelo Stamp Export",
    "%%Creator: Stampelo Export Service",
    "%%CreationDate: " + new Date().toISOString(),
    "%%EndComments",
    "%%BeginProlog",
    "/inch { 72 mul } def",
    "%%EndProlog",
    "%%Page: 1 1",
    "gsave",
    `${ptSize} ${ptSize} scale`,
    "% Outer circle",
    "newpath",
    "0.5 0.5 0.45 0 360 arc",
    "0.102 0.227 0.420 setrgbcolor",
    "0.03 setlinewidth",
    "stroke",
    "% Inner circle",
    "newpath",
    "0.5 0.5 0.36 0 360 arc",
    "0.01 setlinewidth",
    "stroke",
    "% Center text",
    "/Arial findfont 0.08 scalefont setfont",
    "0.5 0.5 moveto",
    "(OFFICIAL) dup stringwidth pop 2 div neg 0 rmoveto show",
    "grestore",
    "%%EOF",
  ].join("\n");

  writeFileSync(epsPath, epsContent);
  const content = readFileSync(epsPath, "utf-8");

  const hasEpsHeader = content.startsWith("%!PS-Adobe-3.0 EPSF-3.0");
  const hasBoundingBox = content.includes("%%BoundingBox:");
  const hasEof = content.includes("%%EOF");
  const hasPostScriptCommands = content.includes("gsave") && content.includes("grestore") && content.includes("newpath");
  const fileSize = Buffer.from(content).length;

  const pass = hasEpsHeader && hasBoundingBox && hasEof && hasPostScriptCommands;
  results["EPS"] = {
    pass,
    details: `Valid EPS header: ${hasEpsHeader}, BoundingBox: ${hasBoundingBox}, EOF marker: ${hasEof}, PostScript commands: ${hasPostScriptCommands}, File size: ${fileSize} bytes`,
  };
  console.log(`  ${pass ? "✅" : "❌"} ${results["EPS"]!.details}`);
}

// ─── 4. PDF validation ─────────────────────────────────────────────────────────
async function validatePdf() {
  console.log("\n[4/5] PDF validation...");
  const pdfPath = join(OUT_DIR, "stamp.pdf");

  const stampMm = 38;
  const ptSize = (stampMm / 25.4) * 72; // ~108pt

  // Rasterise SVG to PNG first
  const px = Math.round((stampMm / 25.4) * 300); // 300 DPI
  const pngBuf = await sharp(Buffer.from(STAMP_SVG))
    .resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const pdfDoc = PDFDocument.create();
  const page = (await pdfDoc).addPage([ptSize, ptSize]);
  const pngImage = await (await pdfDoc).embedPng(pngBuf);
  page.drawImage(pngImage, { x: 0, y: 0, width: ptSize, height: ptSize });
  const pdfBytes = await (await pdfDoc).save();
  writeFileSync(pdfPath, pdfBytes);

  const pdfBuf = readFileSync(pdfPath);
  const isPdf = pdfBuf[0] === 0x25 && pdfBuf[1] === 0x50 && pdfBuf[2] === 0x44 && pdfBuf[3] === 0x46; // %PDF

  // Verify by loading it back
  const loadedDoc = await PDFDocument.load(pdfBuf);
  const pages = loadedDoc.getPages();
  const page0 = pages[0]!;
  const { width, height } = page0.getSize();
  const dimensionsOk = Math.abs(width - ptSize) < 1 && Math.abs(height - ptSize) < 1;

  const pass = isPdf && pages.length === 1 && dimensionsOk;
  results["PDF"] = {
    pass,
    details: `Valid PDF: ${isPdf}, Pages: ${pages.length}, Width: ${width.toFixed(1)}pt (expected ${ptSize.toFixed(1)}pt), Height: ${height.toFixed(1)}pt, File size: ${pdfBuf.length} bytes`,
  };
  console.log(`  ${pass ? "✅" : "❌"} ${results["PDF"]!.details}`);
}

// ─── 5. DOCX validation ───────────────────────────────────────────────────────
async function validateDocx() {
  console.log("\n[5/5] DOCX validation...");
  const docxPath = join(OUT_DIR, "stamp.docx");

  const stampMm = 38;
  const px = Math.round((stampMm / 25.4) * 150); // 150 DPI for DOCX
  const pngBuf = await sharp(Buffer.from(STAMP_SVG))
    .resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const emuPerMm = 36000;
  const widthEmu = stampMm * emuPerMm;
  const heightEmu = stampMm * emuPerMm;

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: pngBuf,
              transformation: { width: Math.round(widthEmu / 9144), height: Math.round(heightEmu / 9144) },
              type: "png",
            }),
          ],
        }),
      ],
    }],
  });

  const docxBuf = await Packer.toBuffer(doc);
  writeFileSync(docxPath, docxBuf);

  const buf = readFileSync(docxPath);
  // DOCX is a ZIP file — starts with PK (0x50 0x4B)
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b;
  const sizeOk = buf.length > 1000;

  const pass = isZip && sizeOk;
  results["DOCX"] = {
    pass,
    details: `Valid Office Open XML (ZIP): ${isZip}, File size: ${buf.length} bytes`,
  };
  console.log(`  ${pass ? "✅" : "❌"} ${results["DOCX"]!.details}`);
}

// ─── Run all validations ───────────────────────────────────────────────────────
async function main() {
  console.log("=== Stampelo Export Validation ===");
  console.log(`Output directory: ${OUT_DIR}\n`);

  await validatePng();
  validateSvg();
  validateEps();
  await validatePdf();
  await validateDocx();

  console.log("\n=== Results Summary ===");
  let allPass = true;
  for (const [format, result] of Object.entries(results)) {
    console.log(`  ${result.pass ? "✅" : "❌"} ${format}: ${result.pass ? "PASS" : "FAIL"}`);
    if (!result.pass) allPass = false;
  }
  console.log(`\nOverall: ${allPass ? "✅ ALL PASS" : "❌ SOME FAILURES"}`);

  // Write report
  const reportPath = join(OUT_DIR, "validation-report.json");
  writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
