/**
 * pdf.js — PDF text extraction helper
 * FileCompare · 3K Digital
 *
 * Requires pdf.js (cdnjs) to be loaded before this script.
 * Configures the worker and exposes window.readPDF(file) → Promise<string>
 *
 * Throws a human-readable Error for:
 *   - Image-based / scanned PDFs (no extractable text)
 *   - Corrupted or password-protected files
 *   - pdf.js not available
 */

(function () {
  'use strict';

  // Configure pdf.js worker as soon as this module loads.
  // The workerSrc must match the version loaded in <head>.
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  /**
   * Extract human-readable text from a PDF File object.
   *
   * Strategy:
   *   - Iterate every page and collect TextItem objects from getTextContent().
   *   - Reconstruct lines using vertical (Y) position changes.
   *   - Insert spaces where horizontal gaps suggest word boundaries.
   *   - Prepend a page-separator header before each page.
   *
   * @param {File} file
   * @returns {Promise<string>}
   */
  async function readPDF(file) {
    if (!window.pdfjsLib) {
      throw new Error(
        'PDF reader is unavailable. Please refresh the page, or try a text-based file instead.'
      );
    }

    // Load the PDF document from an ArrayBuffer
    const buffer = await file.arrayBuffer();
    let pdf;

    try {
      pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    } catch (err) {
      throw new Error(
        'Could not open this PDF. The file may be corrupted or password-protected.'
      );
    }

    let fullText = '';
    let hadAnyText = false;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page    = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      if (!content.items || content.items.length === 0) {
        // Blank page — add placeholder so line numbers stay meaningful
        fullText += `──── Page ${pageNum} of ${totalPages} ────\n(blank page)\n\n`;
        continue;
      }

      let pageText = '';
      let lastY    = null;
      let lastXEnd = null;

      for (const item of content.items) {
        // Skip empty items that only carry layout hints
        if (!item.str && !item.hasEOL) continue;

        const y = Math.round(item.transform[5]);
        const x = Math.round(item.transform[4]);

        if (lastY !== null && Math.abs(y - lastY) > 4) {
          // Significant vertical gap → new line
          pageText += '\n';
        } else if (lastXEnd !== null && x > lastXEnd + 8) {
          // Horizontal gap between items on same line → word space
          pageText += ' ';
        }

        pageText += item.str;

        if (item.hasEOL) {
          pageText += '\n';
        }

        lastY    = y;
        lastXEnd = x + (item.width || 0);

        if (item.str.trim()) {
          hadAnyText = true;
        }
      }

      fullText += `──── Page ${pageNum} of ${totalPages} ────\n`;
      fullText += pageText.trim();
      fullText += '\n\n';
    }

    // If we iterated all pages and never found selectable text, it's a scan
    if (!hadAnyText) {
      throw new Error(
        'This PDF appears to be image-based (scanned) and cannot be compared as text. ' +
        'Please use a PDF with selectable text, or run it through an OCR tool first.'
      );
    }

    return fullText;
  }

  // Expose globally so app.js can call it
  window.readPDF = readPDF;
})();
