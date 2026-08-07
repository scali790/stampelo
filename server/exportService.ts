import { renderStampSvg } from "../client/src/editor/svgUtils";
import type { Stamp } from "../client/src/editor/types";

// ─── SVG Export ───────────────────────────────────────────────────────────────
export function generateSvg(stamp: Stamp): string {
  return renderStampSvg(stamp, { forExport: true });
}

// ─── PNG Export via Sharp ─────────────────────────────────────────────────────
export async function generatePng(stamp: Stamp, dpi = 600): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const svgString = generateSvg(stamp);
  // At 600 DPI, 38mm = 38 * 600/25.4 ≈ 898px
  const sizePx = Math.round((stamp.widthMm * dpi) / 25.4);
  const svgBuffer = Buffer.from(svgString);
  const png = await sharp(svgBuffer)
    .resize(sizePx, sizePx, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return png;
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

