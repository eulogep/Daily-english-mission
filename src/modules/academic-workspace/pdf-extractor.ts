import type { PdfExtractedPage, PdfExtractedSection, PdfExtractionResult, PdfExtractionStatus, PdfType } from "./types";

export const PDFJS_EXTRACTION_METHOD = "PDFJS_DIST_6_2_108_LOCAL";

export type PdfPageInput = { pageNumber: number; text: string | null; error?: string };

function normalizeText(value: string) {
  return value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function classifyPdfType(pages: PdfExtractedPage[]): PdfType {
  if (pages.length === 0) return "UNKNOWN";
  const readable = pages.filter((page) => page.characterCount >= 20).length;
  const ratio = readable / pages.length;
  if (ratio >= 0.7) return "TEXT_PDF";
  if (ratio <= 0.1) return "SCANNED_PDF";
  return "MIXED_PDF";
}

export function pdfStatusFromPages(pages: PdfExtractedPage[], pdfType: PdfType, failedPageCount = 0): PdfExtractionStatus {
  if (pages.length === 0) return "FAILED";
  if (pdfType === "SCANNED_PDF") return "OCR_REQUIRED";
  if (pages.every((page) => page.characterCount === 0)) return "NO_TEXT";
  if (failedPageCount > 0 || pdfType === "MIXED_PDF" || pages.some((page) => page.status === "NO_TEXT")) return "PARTIAL";
  return "SUCCESS";
}

function headingCandidate(page: PdfExtractedPage) {
  const firstLine = page.text.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
  if (/^\d{2}\s*-\s*\S.{2,80}$/.test(firstLine)) return { title: firstLine.replace(/^\d{2}\s*-\s*/, ""), status: "VERIFIED" as const };
  if (/^(introduction|modèles? de référence|encapsulation|couche\s|classification|catégories|topologie)/i.test(firstLine) && firstLine.length <= 90) {
    return { title: firstLine.replace(/\s+\d+$/, ""), status: "NEEDS_REVIEW" as const };
  }
  return null;
}

export function detectPdfSections(sourceId: string, pages: PdfExtractedPage[], createdAt: string, extractionMethod = PDFJS_EXTRACTION_METHOD): PdfExtractedSection[] {
  const headings = pages.flatMap((page) => {
    const candidate = headingCandidate(page);
    return candidate ? [{ ...candidate, pageStart: page.pageNumber }] : [];
  }).filter((candidate, index, all) => index === 0 || candidate.title !== all[index - 1].title);
  return headings.map((heading, index) => {
    const nextPageStart = headings[index + 1]?.pageStart;
    const pageEnd = Math.max(heading.pageStart, nextPageStart ? nextPageStart - 1 : pages.at(-1)?.pageNumber ?? heading.pageStart);
    return {
      id: `PDF-SECTION:${sourceId}:${heading.pageStart}`,
      sourceId,
      title: heading.title,
      pageStart: heading.pageStart,
      pageEnd,
      extractionMethod,
      createdAt,
      verificationStatus: heading.status,
      text: pages.filter((page) => page.pageNumber >= heading.pageStart && page.pageNumber <= pageEnd).map((page) => page.text).join("\n\n"),
    };
  });
}

export function buildPdfExtractionResult(sourceId: string, inputs: PdfPageInput[], pageCount = inputs.length, createdAt = new Date().toISOString(), warnings: string[] = []): PdfExtractionResult {
  const pages: PdfExtractedPage[] = inputs.map((input) => {
    const text = normalizeText(input.text ?? "");
    return { pageNumber: input.pageNumber, text, characterCount: text.length, status: input.error ? "FAILED" : text ? "EXTRACTED" : "NO_TEXT" };
  });
  const pdfType = classifyPdfType(pages);
  const failed = inputs.filter((input) => input.error).length;
  const status = pdfStatusFromPages(pages, pdfType, failed);
  const combinedWarnings = [
    ...warnings,
    ...(pdfType === "SCANNED_PDF" ? ["Aucune couche texte fiable détectée. OCR requis; aucun texte n’a été inventé."] : []),
    ...(pdfType === "MIXED_PDF" ? ["Le document contient un mélange de pages lisibles et de pages sans texte exploitable."] : []),
    ...(failed ? [`${failed} page(s) n’ont pas pu être extraites.`] : []),
  ];
  return { sourceId, status, pdfType, pageCount, pages, sections: detectPdfSections(sourceId, pages, createdAt), warnings: combinedWarnings, extractionMethod: PDFJS_EXTRACTION_METHOD };
}

export async function extractPdfBytes(sourceId: string, bytes: Uint8Array, createdAt = new Date().toISOString()): Promise<PdfExtractionResult> {
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const document = await getDocument({ data: bytes, useSystemFonts: true }).promise;
    const inputs: PdfPageInput[] = [];
    const warnings: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      try {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        let text = "";
        for (const item of content.items) {
          if (!("str" in item)) continue;
          text += item.str + (item.hasEOL ? "\n" : " ");
        }
        inputs.push({ pageNumber, text });
      } catch (error) {
        inputs.push({ pageNumber, text: null, error: error instanceof Error ? error.message : "Page extraction failed" });
      }
    }
    return buildPdfExtractionResult(sourceId, inputs, document.numPages, createdAt, warnings);
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    const corrupted = /InvalidPDF|FormatError|UnexpectedResponse/i.test(name);
    return {
      sourceId,
      status: corrupted ? "CORRUPTED" : "FAILED",
      pdfType: "UNKNOWN",
      pageCount: 0,
      pages: [],
      sections: [],
      warnings: [corrupted ? "Le PDF est corrompu ou structurellement invalide." : "L’extraction PDF locale a échoué."],
      extractionMethod: PDFJS_EXTRACTION_METHOD,
    };
  }
}

export function boundedPdfResult(result: PdfExtractionResult, pageStart: number, pageEnd: number): PdfExtractionResult {
  const pages = result.pages.filter((page) => page.pageNumber >= pageStart && page.pageNumber <= pageEnd);
  return {
    ...result,
    pages,
    sections: detectPdfSections(result.sourceId, pages, new Date().toISOString(), result.extractionMethod),
    warnings: [...result.warnings, `Extraction bornée aux pages ${pageStart}–${pageEnd}; le reste du PDF n’est pas ingéré.`],
  };
}
