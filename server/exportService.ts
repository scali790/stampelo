import { renderStampSvg } from "../client/src/editor/svgUtils";
import type { Stamp } from "../client/src/editor/types";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFileSync } from "fs";
import { join } from "path";

// Initialise resvg-wasm once (lazy, idempotent)
let resvgReady = false;
async function ensureResvg() {
  if (resvgReady) return;
  const wasmPath = join(process.cwd(), "node_modules/@resvg/resvg-wasm/index_bg.wasm");
  const wasmBuffer = readFileSync(wasmPath);
  await initWasm(wasmBuffer);
  resvgReady = true;
}

// ─── SVG Export ───────────────────────────────────────────────────────────────
export function generateSvg(stamp: Stamp): string {
  return renderStampSvg(stamp, { forExport: true });
}

// ─── PNG Export via Sharp ─────────────────────────────────────────────────────
export async function generatePng(stamp: Stamp, dpi = 600): Promise<Buffer> {
  await ensureResvg();
  const svgString = generateSvg(stamp);
  // At given DPI, 38mm = 38 * dpi/25.4 ≈ 898px at 600 DPI
  const sizePx = Math.round((stamp.widthMm * dpi) / 25.4);
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: sizePx },
    background: "rgba(0,0,0,0)",
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  rendered.free();
  return Buffer.from(png);
}

// ─── EPS Export (SVG wrapped in EPS) ─────────────────────────────────────────
export function generateEps(stamp: Stamp): string {
  const svgString = generateSvg(stamp);
  const sizePt = Math.round((stamp.widthMm * 72) / 25.4);
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${sizePt} ${sizePt}
%%Title: Stampelo Export
%%Creator: Stampelo
%%EndComments
/svgdata (${Buffer.from(svgString).toString("base64")}) def
%%EOF`;
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
export async function generatePdf(stamp: Stamp): Promise<Buffer> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const pngBuffer = await generatePng(stamp, 300);
  const pdfDoc = await PDFDocument.create();
  const sizePt = (stamp.widthMm * 72) / 25.4;
  const page = pdfDoc.addPage([sizePt + 40, sizePt + 40]);
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(pngImage, {
    x: 20,
    y: 20,
    width: sizePt,
    height: sizePt,
  });
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ─── DOCX Export ─────────────────────────────────────────────────────────────
export async function generateDocx(stamp: Stamp): Promise<Buffer> {
  const { Document, Packer, Paragraph, ImageRun, AlignmentType } = await import("docx");
  const pngBuffer = await generatePng(stamp, 150);
  const sizeCm = stamp.widthMm / 10;
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: pngBuffer,
              transformation: {
                width: Math.round(sizeCm * 37.8),
                height: Math.round(sizeCm * 37.8),
              },
              type: "png",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [],
        }),
      ],
    }],
  });
  return await Packer.toBuffer(doc);
}
