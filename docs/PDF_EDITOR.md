# PDF Editor

## Overview

The PDF Editor allows users to upload a PDF document, place a stamp on any page, and download the merged result. Accessible at `/pdf-editor`.

## Upload

- Accepted format: PDF
- Upload endpoint: `pdfEditor.uploadPdf` tRPC mutation
- Storage: uploaded PDF stored in Vercel Blob at `pdf-uploads/{nanoid()}.pdf`

## Rendering

PDF pages are rendered client-side using `pdfjs-dist` for visual preview.

## Server Merge

The `pdfEditor.mergePdf` tRPC mutation:
1. Loads the uploaded PDF from Vercel Blob
2. Renders the stamp as a PNG (using `sharp`)
3. Embeds the PNG onto the specified page using `pdf-lib`
4. Stores the merged PDF in Vercel Blob at `pdf-merged/{nanoid()}.pdf`
5. Returns a download URL

## Current Limitations

- PDF upload size limit: Vercel serverless functions default to 4.5 MB body limit
- PDF Editor functionality on current Vercel production has not been fully smoke-tested — see `docs/OPEN_ITEMS.md`
