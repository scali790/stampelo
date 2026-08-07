/**
 * Server-side PDF stamp merge service.
 * Takes a PDF buffer, a stamp SVG string, placement parameters, and a list of
 * page indices to stamp, and returns a new PDF buffer with the stamp embedded.
 */

import { PDFDocument, degrees } from "pdf-lib";

export interface StampPlacement {
  /** 0-100: percentage of page width from left */
  xPct: number;
  /** 0-100: percentage of page height from top */
  yPct: number;
  /** Scale factor (1.0 = natural size) */
  scale: number;
  /** Rotation in degrees */
  rotation: number;
  /** Physical stamp width in mm */
  stampWidthMm: number;
}

/**
 * Merge a stamp SVG onto specified pages of a PDF.
 * @param pdfBuffer  Original PDF bytes
 * @param stampSvg   Full SVG string of the stamp (no watermark)
 * @param placement  Position/scale/rotation parameters
 * @param pageIndices 0-based page indices to stamp (empty = all pages)
 * @returns New PDF buffer with stamps embedded
 */
export async function mergePdfStamp(
  pdfBuffer: Buffer,
  stampSvg: string,
  placement: StampPlacement,
  pageIndices: number[]
): Promise<Buffer> {
  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  // Determine which pages to stamp
  const targets = pageIndices.length > 0
    ? pageIndices.filter((i) => i >= 0 && i < totalPages)
    : Array.from({ length: totalPages }, (_, i) => i);

  // Rasterise the stamp SVG to PNG at 300 DPI
  // Physical stamp size: stampWidthMm mm → pixels at 300 DPI
  const dpi = 300;
  const stampPxNatural = Math.round((placement.stampWidthMm * dpi) / 25.4);
  const stampPxScaled = Math.round(stampPxNatural * placement.scale);

  // Ensure minimum size
  const stampPx = Math.max(stampPxScaled, 20);

  // Rasterise SVG → PNG with transparent background
  const svgBuffer = Buffer.from(stampSvg);
  // Dynamic import avoids native binary crash at module initialization on Vercel
  const sharp = (await import("sharp")).default;
  const pngBuffer = await sharp(svgBuffer)
    .resize(stampPx, stampPx, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Embed PNG into PDF
  const pngImage = await pdfDoc.embedPng(pngBuffer);

  for (const pageIdx of targets) {
    const page = pages[pageIdx];
    if (!page) continue;

    const { width: pageWidthPt, height: pageHeightPt } = page.getSize();

    // Convert percentage position to PDF points
    // PDF coordinate system: origin at bottom-left
    const stampWidthPt = (stampPx / dpi) * 72;
    const stampHeightPt = stampWidthPt;

    const xPt = (placement.xPct / 100) * pageWidthPt - stampWidthPt / 2;
    // PDF y is from bottom; our yPct is from top
    const yPt = pageHeightPt - (placement.yPct / 100) * pageHeightPt - stampHeightPt / 2;

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
