import { generatePng, generateSvg, generateEps, generatePdf } from "./exportService";

const shapes = ["round", "oval", "rectangular", "triangular"] as const;
const sizes = [20, 38, 60, 100];

async function validateShape(shape: typeof shapes[number], sizeMm: number) {
  const stamp = {
    id: "test", shape, widthMm: sizeMm, color: "#1a3a6b",
    effects: { shabby: false, gold: false, silver: false },
    elements: [
      { id: "e1", type: "frame", color: "#1a3a6b", visible: true, radius: 90, strokeWidth: 4, lineBreakGap: 0 },
      { id: "e2", type: "centerText", color: "#1a3a6b", visible: true, text: shape.toUpperCase(), font: "Arial", fontSize: 12, bold: true, italic: false, x: 50, y: 50 },
    ]
  };

  try {
    const png = await generatePng(stamp as any, 300);
    const svg = generateSvg(stamp as any);
    const eps = generateEps(stamp as any);
    const pdf = await generatePdf(stamp as any);

    // PNG magic bytes: 0x89 0x50 0x4E 0x47 — valid even for small stamps
    const pngValid = png.length > 100 && png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4E && png[3] === 0x47;
    const svgValid = svg.includes("<svg") && svg.includes("xmlns");
    const epsValid = eps.includes("%!PS-Adobe");
    const pdfValid = pdf.length > 1000;

    const status = pngValid && svgValid && epsValid && pdfValid ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status} shape=${shape} size=${sizeMm}mm PNG=${png.length}b SVG=${svg.length}b EPS=${eps.length}b PDF=${pdf.length}b`);
    return pngValid && svgValid && epsValid && pdfValid;
  } catch (e: any) {
    console.log(`  ❌ ERROR shape=${shape} size=${sizeMm}mm: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("=== Multi-shape export validation (4 shapes × 4 sizes = 16 combinations) ===");
  let passed = 0;
  let failed = 0;
  for (const shape of shapes) {
    for (const size of sizes) {
      const ok = await validateShape(shape, size);
      if (ok) passed++; else failed++;
    }
  }
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
