/**
 * Server-side PDF stamp merge service.
 * Uses @resvg/resvg-wasm (pure WebAssembly, no native binaries) to rasterise
 * the stamp SVG to PNG, then embeds it into the PDF with pdf-lib.
 */
import { PDFDocument, degrees } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";

export interface StampPlacement {
  xPct: number;
  yPct: number;
  scale: number;
  rotation: number;
  stampWidthMm: number;
}

let wasmInitialised = false;

async function ensureWasmInit() {
  if (wasmInitialised) return;
  const { initWasm } = await import("@resvg/resvg-wasm");
  // Load the WASM binary from the package directory
  const wasmPath = join(
    process.cwd(),
    "node_modules/@resvg/resvg-wasm/index_bg.wasm"
  );
  const wasmBuffer = readFileSync(wasmPath);
  await initWasm(wasmBuffer);
  wasmInitialised = true;
}

export async function mergePdfStamp(
  pdfBuffer: Buffer,
  stampSvg: string,
  placement: StampPlacement,
  pageIndices: number[]
): Promise<Buffer> {
  await ensureWasmInit();

  const { Resvg } = await import("@resvg/resvg-wasm");

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const targets =
    pageIndices.length > 0
      ? pageIndices.filter((i) => i >= 0 && i < totalPages)
      : Array.from({ length: totalPages }, (_, i) => i);

  // Rasterise stamp SVG to PNG at 300 DPI
  const dpi = 300;
  const stampPxNatural = Math.round((placement.stampWidthMm * dpi) / 25.4);
  const stampPx = Math.max(Math.round(stampPxNatural * placement.scale), 20);

  const resvg = new Resvg(stampSvg, {
    dpi,
    fitTo: { mode: "width", value: stampPx },
  });
  const rendered = resvg.render();
  const pngData = rendered.asPng();
  rendered.free();

  const pngImage = await pdfDoc.embedPng(pngData);

  for (const pageIdx of targets) {
    const page = pages[pageIdx];
    if (!page) continue;
    const { width: pageWidthPt, height: pageHeightPt } = page.getSize();
    const stampWidthPt = (stampPx / dpi) * 72;
    const stampHeightPt = stampWidthPt;
    const xPt = (placement.xPct / 100) * pageWidthPt - stampWidthPt / 2;
    const yPt =
      pageHeightPt -
      (placement.yPct / 100) * pageHeightPt -
      stampHeightPt / 2;
    page.drawImage(pngImage, {
      x: xPt,
      y: yPt,
      width: stampWidthPt,
      height: stampHeightPt,
      rotate: degrees(-placement.rotation),
      opacity: 0.92,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
