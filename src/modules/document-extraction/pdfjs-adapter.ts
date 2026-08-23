import { readFile } from "node:fs/promises";
import { buildPdfExtractionResult, extractPdfBytes } from "../academic-workspace/pdf-extractor.ts";
import { documentQuality, pageQuality } from "./core.ts";
import type { Document, DocumentExtractor, DocumentPage, ExtractionOptions } from "./types";

export class PdfJsDocumentExtractor implements DocumentExtractor {
  readonly id = "PDFJS" as const;
  readonly supportedFormats = ["PDF"] as const;
  readonly capabilities = { text: true, layout: false, tables: false, formulas: false, pictures: false, ocr: false };
  readonly version = "6.2.108";
  readonly localOnly = true as const;
  async extract(documentPath: string, options: ExtractionOptions): Promise<Document> {
    const legacy = await extractPdfBytes(options.sourceId, new Uint8Array(await readFile(documentPath)));
    const bounded = buildPdfExtractionResult(options.sourceId, legacy.pages.filter((page) => page.pageNumber >= options.pageStart && page.pageNumber <= options.pageEnd).map((page) => ({ pageNumber: page.pageNumber, text: page.text })), legacy.pageCount);
    const pages = bounded.pages.map((page) => {
      const block = page.text ? [{ id: `pdfjs:${page.pageNumber}`, kind: "TEXT" as const, label: "text", text: page.text, pageNumber: page.pageNumber, sectionId: null, boundingBox: null, confidence: page.characterCount >= 20 ? 0.9 : 0.5, quality: page.characterCount >= 20 ? "HIGH" as const : "LOW" as const, provenance: { sourceId: options.sourceId, pageNumber: page.pageNumber, extractorId: "PDFJS" as const, blockId: `pdfjs:${page.pageNumber}` } }] : [];
      const visualRequested = Boolean(options.detectPictures || options.detectTables || options.detectFormulas);
      const normalized: DocumentPage = { pageNumber: page.pageNumber, width: null, height: null, text: page.text, blocks: block, images: [], tables: [], textStatus: page.text ? "EXTRACTED" : "NOT_DETECTED", visualStatus: visualRequested ? "PARTIAL" : "NOT_DETECTED", quality: "LOW", warnings: ["PDF.js ne modélise pas les relations visuelles complexes."] };
      normalized.quality = pageQuality(normalized);
      return normalized;
    });
    const blocks = pages.flatMap((page) => page.blocks);
    const document: Document = { schemaVersion: 1, sourceId: options.sourceId, title: options.sourceId, format: "PDF", extractorId: "PDFJS", extractorVersion: this.version, localOnly: true, pageCount: pages.length, pages, sections: [], blocks, tables: [], formulas: [], images: [], visualContent: [], extractionQuality: "LOW", quality: "LOW", provenance: { sourceId: options.sourceId, extractorId: "PDFJS", extractorVersion: this.version, pageStart: options.pageStart, pageEnd: options.pageEnd }, warnings: bounded.warnings };
    document.quality = documentQuality(document);
    document.extractionQuality = document.quality;
    return document;
  }
}
