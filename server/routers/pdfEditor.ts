import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { mergePdfStamp } from "../pdfStampService";
import { storagePut, storageGet } from "../storage";
import { nanoid } from "nanoid";

export const pdfEditorRouter = router({
  /**
   * Upload a PDF and get back a storage key AND full blob URL for subsequent operations.
   * Accepts base64-encoded PDF content.
   */
  uploadPdf: publicProcedure
    .input(z.object({
      pdfBase64: z.string(),
      filename: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const pdfBuffer = Buffer.from(input.pdfBase64, "base64");
      if (pdfBuffer.length > 20 * 1024 * 1024) {
        throw new Error("PDF file too large (max 20 MB)");
      }
      const key = `pdf-uploads/${nanoid()}.pdf`;
      const { url } = await storagePut(key, pdfBuffer, "application/pdf");
      // Return both key and full blob URL so stampPdf can fetch the PDF directly
      return { key, url };
    }),

  /**
   * Merge a stamp onto specified pages of a previously uploaded PDF.
   * Returns a URL to download the stamped PDF.
   */
  stampPdf: publicProcedure
    .input(z.object({
      pdfKey: z.string(),
      pdfUrl: z.string().optional(), // full blob URL (preferred over key lookup)
      stampSvg: z.string(),
      placement: z.object({
        xPct: z.number().min(0).max(100),
        yPct: z.number().min(0).max(100),
        stampSizePct: z.number().min(0.5).max(100),
        rotation: z.number().min(0).max(360),
        stampWidthMm: z.number().min(10).max(200),
      }),
      pageIndices: z.array(z.number().int().min(0)).default([]),
    }))
    .mutation(async ({ input }) => {
      // Use the full URL if provided (avoids storageGet URL reconstruction issues)
      const pdfUrl = input.pdfUrl ?? (await storageGet(input.pdfKey)).url;
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) throw new Error("Failed to fetch PDF from storage");
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

      // Merge stamp
      const stampedPdf = await mergePdfStamp(
        pdfBuffer,
        input.stampSvg,
        input.placement,
        input.pageIndices
      );

      // Store stamped PDF and return its URL
      const outputKey = `pdf-stamped/${nanoid()}.pdf`;
      const { url: downloadUrl } = await storagePut(outputKey, stampedPdf, "application/pdf");
      return { downloadUrl, outputKey };
    }),
});
