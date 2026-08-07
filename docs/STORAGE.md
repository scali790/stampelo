# Storage

## Provider: Vercel Blob

Generated export files are stored in [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).

## Bucket Structure

```
exports/{orderId}/png.png      — High-res PNG (600 DPI, transparent)
exports/{orderId}/svg.svg      — SVG vector
exports/{orderId}/eps.eps      — EPS PostScript
exports/{orderId}/pdf.pdf      — PDF
exports/{orderId}/docx.docx    — Word DOCX
pdf-uploads/{token}/input.pdf  — Uploaded PDFs for PDF editor
pdf-outputs/{token}/output.pdf — Stamped PDF outputs
```

## Access

All export files are stored with `access: "public"` in Vercel Blob.
Download URLs are sent by email and stored in the `orders.downloadUrls` column.

## Local Development

When `BLOB_READ_WRITE_TOKEN` is not set, files are stored in `.local-storage/` (gitignored).
